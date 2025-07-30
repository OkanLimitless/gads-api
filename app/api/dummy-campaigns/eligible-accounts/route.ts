import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'
import { getCampaigns } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Dummy Campaigns - Fetching eligible accounts (0 campaigns)')
    const session = await getServerSession(authOptions)

    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Use hardcoded MCC ID as specified
    const mccId = '1284928552'
    
    // Hidden account IDs that should be excluded from selection
    const hiddenAccountIds = [
      '7543640452', '1981739507', '2455272543', 
      '2943276700', '5353988239', '5299881560', '6575141691'
    ]

    console.log(`🏢 Fetching client accounts for MCC: ${mccId}`)

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

    // Query customer clients managed by this MCC
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

    console.log(`📊 Querying client accounts for MCC ${mccId}...`)
    const clientsResponse = await mccCustomerClient.query(clientsQuery)

    console.log(`✅ Found ${clientsResponse.length} client accounts`)

    // Transform the response and filter out hidden accounts
    const clientAccounts = clientsResponse
      .map((item: any) => {
        const client = item.customer_client
        const clientId = client.client_customer?.split('/')[1] || 'unknown'
        
        return {
          id: clientId,
          name: client.descriptive_name || `Client Account ${clientId}`,
          currency: client.currency_code || 'USD',
          timeZone: client.time_zone || 'UTC',
          status: client.status || 'UNKNOWN',
          canManageCampaigns: true,
          testAccount: client.test_account || false,
          isManager: false,
          managerCustomerId: mccId,
          level: client.level || 1,
          accountType: 'CLIENT' as const,
        }
      })
      .filter(account => !hiddenAccountIds.includes(account.id))

    console.log(`🔍 Checking campaign counts for ${clientAccounts.length} accounts...`)

    // Check campaign count for each account
    const eligibleAccounts = []
    
    for (const account of clientAccounts) {
      try {
        console.log(`📊 Checking campaigns for account ${account.id} (${account.name})`)
        const campaigns = await getCampaigns(account.id, session.refreshToken)
        const campaignCount = campaigns.length
        
        console.log(`📈 Account ${account.id} has ${campaignCount} campaigns`)
        
        if (campaignCount === 0) {
          eligibleAccounts.push({
            ...account,
            campaignCount: 0
          })
          console.log(`✅ Account ${account.id} (${account.name}) is eligible - 0 campaigns`)
        } else {
          console.log(`❌ Account ${account.id} (${account.name}) not eligible - ${campaignCount} campaigns`)
        }
      } catch (error) {
        console.error(`⚠️ Error checking campaigns for account ${account.id}:`, error)
        // Skip accounts we can't access rather than failing the whole request
        continue
      }
    }

    console.log(`🎯 Found ${eligibleAccounts.length} eligible accounts (0 campaigns) out of ${clientAccounts.length} total accounts`)

    return NextResponse.json({
      success: true,
      mccId,
      eligibleAccounts,
      totalEligible: eligibleAccounts.length,
      totalChecked: clientAccounts.length,
      criteria: 'Accounts with 0 campaigns'
    })

  } catch (error) {
    console.error('💥 Error fetching eligible accounts for dummy campaigns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch eligible accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}