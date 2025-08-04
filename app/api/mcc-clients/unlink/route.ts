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

    if (!mccId) {
      return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })
    }

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'Account IDs array is required' }, { status: 400 })
    }

    console.log(`🔓 Unlinking ${accountIds.length} accounts from MCC: ${mccId}`)
    console.log('📋 Accounts to unlink:', accountIds)

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
      login_customer_id: mccId, // Use MCC as login customer
    })

    const results = []
    const errors = []

    // Process each account to unlink
    for (const accountId of accountIds) {
      try {
        console.log(`🔓 Unlinking account ${accountId} from MCC ${mccId}`)

        // Create the customer client link resource name
        const customerClientLinkResourceName = `customers/${mccId}/customerClientLinks/${accountId}`

        console.log(`🔧 Removing customer client link: ${customerClientLinkResourceName}`)

        // Use mutateResources to remove the customer client link
        const operations = [
          {
            entity: "customer_client_link",
            operation: "remove",
            resource_name: customerClientLinkResourceName
          }
        ]

        const response = await mccCustomerClient.mutateResources(operations)

        console.log(`✅ Successfully unlinked account ${accountId}`)
        
        results.push({
          accountId,
          status: 'success',
          message: 'Account successfully unlinked from MCC'
        })

      } catch (error: any) {
        console.error(`💥 Error unlinking account ${accountId}:`, error)
        
        // Handle specific Google Ads API errors
        let errorMessage = 'Unknown error occurred'
        if (error.errors && error.errors.length > 0) {
          errorMessage = error.errors[0].message || error.message
        } else if (error.message) {
          errorMessage = error.message
        }

        errors.push({
          accountId,
          status: 'error',
          message: errorMessage,
          error: error.toString()
        })

        results.push({
          accountId,
          status: 'error',
          message: errorMessage
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`📊 Unlink operation completed: ${successCount} successful, ${errorCount} errors`)

    // Return results
    return NextResponse.json({
      success: errorCount === 0,
      message: errorCount === 0 
        ? `Successfully unlinked ${successCount} accounts from MCC`
        : `Unlinked ${successCount} accounts, ${errorCount} failed`,
      results,
      summary: {
        total: accountIds.length,
        successful: successCount,
        failed: errorCount,
        mccId,
        accountIds
      }
    })

  } catch (error: any) {
    console.error('💥 Error in MCC unlink operation:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to unlink accounts from MCC',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}