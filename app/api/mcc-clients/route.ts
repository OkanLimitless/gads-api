import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 MCC Clients API called')
    const session = await getServerSession(authOptions)
    console.log('📋 Session check:', {
      hasSession: !!session,
      hasRefreshToken: !!session?.refreshToken,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
      error: session?.error
    })

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
    const clientsResponse = await mccCustomerClient.query({
      query: clientsQuery,
    })

    console.log(`✅ Found ${clientsResponse.length} client accounts:`, clientsResponse)

    // Transform the response to match our AdAccount interface
    const clientAccounts = clientsResponse.map((item: any) => {
      const client = item.customer_client
      const clientId = client.client_customer?.split('/')[1] || 'unknown'
      
      return {
        id: clientId,
        name: client.descriptive_name || `Client Account ${clientId}`,
        currency: client.currency_code || 'USD',
        timeZone: client.time_zone || 'UTC',
        status: client.status || 'UNKNOWN',
        canManageCampaigns: true, // Client accounts can manage campaigns
        testAccount: client.test_account || false,
        isManager: false, // These are client accounts
        managerCustomerId: mccId, // They're managed by this MCC
        level: client.level || 1,
        accountType: 'CLIENT' as const,
      }
    })

    console.log(`🎯 Returning ${clientAccounts.length} client accounts for MCC ${mccId}`)

    return NextResponse.json({
      success: true,
      mccId,
      clientAccounts,
      totalClients: clientAccounts.length
    })

  } catch (error) {
    console.error('💥 Error fetching MCC clients:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch MCC client accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}