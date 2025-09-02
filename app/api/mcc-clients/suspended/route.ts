import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'
import { getCampaignPerformance } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 MCC Suspended Clients API called')
    const session = await getServerSession(authOptions)

    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get MCC ID from query params
    const { searchParams } = new URL(request.url)
    const mccId = searchParams.get('mccId')

    if (!mccId) {
      return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })
    }

    console.log(`🔍 Detecting suspended client accounts for MCC: ${mccId}`)

    // Initialize Google Ads client
    const googleAdsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })

    // Create customer client for the MCC account
    const mccCustomerClient = googleAdsClient.Customer({
      customer_id: mccId,
      refresh_token: session.refreshToken,
    })

    // Helper: normalize status values from API (numbers -> strings)
    const STATUS_MAP: Record<number, string> = {
      0: 'UNSPECIFIED',
      1: 'UNKNOWN',
      2: 'ENABLED',
      3: 'CANCELED',
      4: 'SUSPENDED',
    }
    const normalizeCustomerStatus = (status: any): string => {
      if (typeof status === 'string') return status
      if (typeof status === 'number') return STATUS_MAP[status] || 'UNKNOWN'
      return 'UNKNOWN'
    }

    // Query ALL customer clients managed by this MCC to find suspended ones
    // Note: Google Ads Query Language doesn't support OR with parentheses
    // We'll need to make two separate queries or use a different approach
    const clientsQuery = `
      SELECT 
        customer_client.client_customer,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.status,
        customer_client.test_account,
        customer_client.manager,
        customer_client.level
      FROM customer_client
      WHERE customer_client.level = 1
      AND customer_client.manager = false
      AND customer_client.status = 'SUSPENDED'
    `

    console.log(`🚨 Querying suspended client accounts for MCC ${mccId}...`)
    const clientsResponse = await mccCustomerClient.query(clientsQuery)

    console.log(`⚠️ Found ${clientsResponse.length} suspended client accounts:`, clientsResponse)

    // Account IDs to exclude from suspended list (requested by user)
    const excludedAccountIds = [
      '1981739507',
      '2455272543', 
      '2943276700',
      '5353988239',
      '5299881560',
      '6575141691'
    ]

    // Transform the response to match our AdAccount interface
    const suspendedAccounts = clientsResponse
      .map((item: any) => {
      const client = item.customer_client
      const clientId = client.client_customer?.split('/')[1] || 'unknown'
      const status = normalizeCustomerStatus(client.status)
      
      return {
        id: clientId,
        name: client.descriptive_name || `Client Account ${clientId}`,
        currency: client.currency_code || 'USD',
        timeZone: client.time_zone || 'UTC',
        status: status,
        canManageCampaigns: false, // Suspended accounts cannot manage campaigns
        testAccount: client.test_account || false,
        isManager: false,
        managerCustomerId: mccId,
        level: client.level || 1,
        accountType: 'CLIENT' as const,
        isSuspended: status === 'SUSPENDED',
        isCanceled: status === 'CANCELED',
        suspensionReason: status === 'SUSPENDED' 
          ? 'Account Suspended' 
          : 'Account Not Enabled',
        detectedAt: new Date().toISOString(),
        detectionReason: status === 'SUSPENDED' 
          ? 'Account Suspended' 
          : 'Account Not Enabled'
      }
    })
    .filter((account: any) => !excludedAccountIds.includes(account.id) && account.status !== 'CANCELED' && !['6575141691','5299881560'].includes(account.id))

    // Get additional details about why accounts might be suspended
    let suspensionDetails = []
    for (const account of suspendedAccounts) {
      try {
        // Try to get more details about the account status
        const accountCustomerClient = googleAdsClient.Customer({
          customer_id: account.id,
          refresh_token: session.refreshToken,
          login_customer_id: mccId,
        })

        const accountDetailsQuery = `
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.status,
            customer.optimization_score,
            customer.pay_per_conversion_eligibility_failure_reasons
          FROM customer
          LIMIT 1
        `

        try {
          const accountDetails = await accountCustomerClient.query(accountDetailsQuery)
          if (accountDetails.length > 0) {
            const details = accountDetails[0].customer
            suspensionDetails.push({
              accountId: account.id,
              optimizationScore: details.optimization_score,
              eligibilityFailures: details.pay_per_conversion_eligibility_failure_reasons || []
            })
          }
        } catch (detailsError) {
          console.log(`⚠️ Could not fetch details for suspended account ${account.id}:`, detailsError)
          suspensionDetails.push({
            accountId: account.id,
            error: 'Cannot access account details - likely requires special permissions'
          })
        }
      } catch (error) {
        console.log(`⚠️ Error fetching additional details for ${account.id}:`, error)
      }
    }

    // New: detect accounts to be deleted based on spend in last 30 days and zero spend yesterday & today
    const allClientsQuery = `
      SELECT 
        customer_client.client_customer,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.status,
        customer_client.test_account,
        customer_client.manager,
        customer_client.level
      FROM customer_client
      WHERE customer_client.level = 1
      AND customer_client.manager = false
    `

    console.log(`📈 Querying ALL client accounts for spend-based detection under MCC ${mccId}...`)
    const allClientsResponse = await mccCustomerClient.query(allClientsQuery)

    const allClientAccounts: Array<{
      id: string
      name: string
      currency: string
      timeZone: string
      status: string
      testAccount: boolean
      level: number
    }> = allClientsResponse.map((item: any) => {
      const client = item.customer_client
      const clientId = client.client_customer?.split('/')[1] || 'unknown'
      return {
        id: clientId,
        name: client.descriptive_name || `Client Account ${clientId}`,
        currency: client.currency_code || 'USD',
        timeZone: client.time_zone || 'UTC',
        status: normalizeCustomerStatus(client.status),
        testAccount: client.test_account || false,
        level: client.level || 1,
      }
    })

    // Only evaluate enabled, non-excluded accounts
    const enabledClientAccounts = allClientAccounts.filter(acc => acc.status === 'ENABLED' && !excludedAccountIds.includes(acc.id))

    // Build date range: last 30 days up to yesterday + today for zero-spend verification
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const start = new Date(yesterday)
    start.setDate(yesterday.getDate() - 29)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const startDate = formatDate(start)
    const endDate = formatDate(yesterday)
    const todayDate = formatDate(now)

    const toBeDeletedAccounts: Array<{
      id: string
      name: string
      currency: string
      timeZone: string
      status: string
      detectedAt: string
      detectionReason: string
      last30DaysCost: number
      yesterdayCost: number
    }> = []

    console.log(`🧮 Evaluating spend from ${startDate} to ${endDate} (yesterday), and verifying zero spend for today ${todayDate}`)

    for (const account of enabledClientAccounts) {
      try {
        const perf = await getCampaignPerformance(account.id, session.refreshToken, {
          startDate,
          endDate,
        })

        // Sum costs across all campaigns and dates
        const totalCostLast30 = perf.reduce((sum, row) => sum + (row.cost || 0), 0)
        const yesterdayCost = perf
          .filter(row => row.date === endDate)
          .reduce((sum, row) => sum + (row.cost || 0), 0)

        // Fetch today's performance to ensure zero spend today as well
        const perfToday = await getCampaignPerformance(account.id, session.refreshToken, {
          startDate: todayDate,
          endDate: todayDate,
        })
        const todayCost = perfToday.reduce((sum, row) => sum + (row.cost || 0), 0)

        if (totalCostLast30 > 50 && yesterdayCost === 0 && todayCost === 0) {
          toBeDeletedAccounts.push({
            id: account.id,
            name: account.name,
            currency: account.currency,
            timeZone: account.timeZone,
            status: account.status,
            detectedAt: new Date().toISOString(),
            detectionReason: `Spent ${totalCostLast30.toFixed(2)} ${account.currency} in last 30 days, and 0.00 ${account.currency} yesterday and today`,
            last30DaysCost: Number(totalCostLast30.toFixed(2)),
            yesterdayCost: 0,
          })
        }
      } catch (err) {
        console.log(`⚠️ Skipping account ${account.id} due to performance fetch error:`, err)
      }
    }

    const result = {
      success: true,
      suspendedAccounts,
      suspensionDetails,
      toBeDeletedAccounts,
      summary: {
        totalSuspended: suspendedAccounts.length,
        suspended: suspendedAccounts.filter(acc => acc.status === 'SUSPENDED').length,
        toBeDeleted: toBeDeletedAccounts.length,
        detectedAt: new Date().toISOString()
      },
      mccId,
      recommendation: suspendedAccounts.length > 0 || toBeDeletedAccounts.length > 0 
        ? "Review flagged accounts and manually remove them from your MCC through the Google Ads interface if necessary."
        : "No flagged accounts detected. Your MCC is clean!"
    }

    console.log(`✅ Detection complete:`, result.summary)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('💥 Error detecting suspended MCC client accounts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to detect suspended client accounts',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}