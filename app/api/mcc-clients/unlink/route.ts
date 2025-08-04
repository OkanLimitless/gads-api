import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 MCC Account Unlink API called')
    const session = await getServerSession(authOptions)

    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { mccId, accountIds } = body

    if (!mccId || !accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      console.log('❌ Missing required parameters')
      return NextResponse.json({ error: 'Missing mccId or accountIds' }, { status: 400 })
    }

    console.log(`🔓 Unlinking ${accountIds.length} accounts from MCC: ${mccId}`)
    console.log('📋 Accounts to unlink:', accountIds)

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })

    // Create customer instance for MCC account
    const mccCustomerClient = client.Customer({
      customer_id: mccId,
      refresh_token: session.refreshToken,
      login_customer_id: mccId, // Required for MCC operations
    })

    const results = []
    const errors = []

    for (const accountId of accountIds) {
      try {
        console.log(`🔓 Unlinking account ${accountId} from MCC ${mccId}`)
        
        // Create the customer client link resource name
        const customerClientLinkResourceName = `customers/${mccId}/customerClientLinks/${accountId}`
        console.log(`🔧 Removing customer client link: ${customerClientLinkResourceName}`)

        // Create the operation for removing the customer client link
        const operations = [
          {
            remove: customerClientLinkResourceName
          }
        ]

        // Execute the mutation
        const response = await mccCustomerClient.mutateResources(operations)
        
        console.log(`✅ Successfully unlinked account ${accountId}`)
        results.push({
          accountId,
          success: true,
          resourceName: response.results?.[0]?.resource_name || customerClientLinkResourceName
        })
      } catch (error) {
        console.error(`💥 Error unlinking account ${accountId}:`, error)
        errors.push({
          accountId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`📊 Unlink operation completed: ${results.length} successful, ${errors.length} errors`)

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: accountIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('💥 Unlink API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}