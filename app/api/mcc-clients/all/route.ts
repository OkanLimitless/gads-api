import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 MCC All Clients API called')
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

    console.log(`🏢 Fetching ALL client accounts for MCC: ${mccId}`)

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

    // Query ALL customer clients managed by this MCC (including suspended)
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
    `

    console.log(`📊 Querying ALL client accounts for MCC ${mccId}...`)
    const clientsResponse = await mccCustomerClient.query(clientsQuery)

    console.log(`✅ Found ${clientsResponse.length} total client accounts:`, clientsResponse)

    // Transform the response to match our AdAccount interface
    const clientAccounts = clientsResponse.map((item: any) => {
      const client = item.customer_client
      const clientId = client.client_customer?.split('/')[1] || 'unknown'
      const status = client.status || 'UNKNOWN'
      
      return {
        id: clientId,
        name: client.descriptive_name || `Client Account ${clientId}`,
        currency: client.currency_code || 'USD',
        timeZone: client.time_zone || 'UTC',
        status: status,
        canManageCampaigns: status === 'ENABLED',
        testAccount: client.test_account || false,
        isManager: false,
        managerCustomerId: mccId,
        level: client.level || 1,
        accountType: 'CLIENT' as const,
        isSuspended: status === 'SUSPENDED' || status === 'CANCELED',
      }
    })

    console.log(`✅ Found ${clientAccounts.length} total client accounts for MCC ${mccId}`)
    
    // Group accounts by status for easy filtering
    const enabledAccounts = clientAccounts.filter(acc => acc.status === 'ENABLED')
    const suspendedAccounts = clientAccounts.filter(acc => acc.isSuspended)
    const otherAccounts = clientAccounts.filter(acc => !acc.isSuspended && acc.status !== 'ENABLED')

    console.log(`📊 Account Status Summary:`)
    console.log(`  - Enabled: ${enabledAccounts.length}`)
    console.log(`  - Suspended/Canceled: ${suspendedAccounts.length}`)
    console.log(`  - Other Status: ${otherAccounts.length}`)

    return NextResponse.json({
      success: true,
      accounts: clientAccounts,
      summary: {
        total: clientAccounts.length,
        enabled: enabledAccounts.length,
        suspended: suspendedAccounts.length,
        other: otherAccounts.length
      },
      mccId
    })

  } catch (error: any) {
    console.error('💥 Error fetching ALL MCC client accounts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch MCC client accounts',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}