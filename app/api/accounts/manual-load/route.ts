import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getCampaigns, getClientAccounts } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ManualAccount {
  id: string
  name: string
  status: 'loading' | 'ready' | 'error' | 'campaign-deployed'
  error?: string
  hasRealCampaigns?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual account loading requested')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { accountIds } = await request.json()

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'accountIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate that all IDs are numeric strings
    const invalidIds = accountIds.filter(id => !/^\d+$/.test(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid account IDs (must be numeric): ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`🔍 Validating ${accountIds.length} manual account IDs:`, accountIds)

    // Get all client accounts from the MCC to validate the provided IDs exist
    const knownMCCId = '1284928552'
    let allClientAccounts: any[] = []
    
    try {
      allClientAccounts = await getClientAccounts(knownMCCId, session.refreshToken)
      console.log(`📋 Found ${allClientAccounts.length} total client accounts in MCC`)
    } catch (error) {
      console.error('💥 Error fetching client accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch client accounts from MCC' },
        { status: 500 }
      )
    }

    const results: ManualAccount[] = []

    for (const accountId of accountIds) {
      try {
        console.log(`🔍 Validating account ${accountId}...`)

        // Check if account exists in MCC
        const accountInfo = allClientAccounts.find(acc => acc.id === accountId)
        
        if (!accountInfo) {
          console.log(`❌ Account ${accountId}: Not found in MCC`)
          results.push({
            id: accountId,
            name: `Account ${accountId}`,
            status: 'error',
            error: 'Account not found in MCC or not accessible'
          })
          continue
        }

        console.log(`✅ Account ${accountId}: Found in MCC as "${accountInfo.name}"`)

        // Check for existing campaigns
        let hasRealCampaigns = false
        try {
          const campaigns = await getCampaigns(accountId, session.refreshToken)
          
          // For manual accounts, we assume ALL campaigns are "real" campaigns
          // since these are accounts that had dummy campaigns before the tracking system
          hasRealCampaigns = campaigns.length > 0
          
          console.log(`📊 Account ${accountId}: Found ${campaigns.length} existing campaigns`)
        } catch (campaignError) {
          console.error(`💥 Error checking campaigns for account ${accountId}:`, campaignError)
          // If we can't check campaigns, assume account is ready (better to show than hide)
          hasRealCampaigns = false
        }

        if (hasRealCampaigns) {
          console.log(`❌ Account ${accountId}: Has existing campaigns - marked as deployed`)
          results.push({
            id: accountId,
            name: accountInfo.name || `Account ${accountId}`,
            status: 'campaign-deployed',
            hasRealCampaigns: true
          })
        } else {
          console.log(`✅ Account ${accountId}: Ready for campaign deployment`)
          results.push({
            id: accountId,
            name: accountInfo.name || `Account ${accountId}`,
            status: 'ready',
            hasRealCampaigns: false
          })
        }

      } catch (error) {
        console.error(`💥 Error validating account ${accountId}:`, error)
        results.push({
          id: accountId,
          name: `Account ${accountId}`,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown validation error'
        })
      }
    }

    const readyCount = results.filter(r => r.status === 'ready').length
    const deployedCount = results.filter(r => r.status === 'campaign-deployed').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`✅ Manual account validation complete: ${readyCount} ready, ${deployedCount} deployed, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      accounts: results,
      summary: {
        total: results.length,
        ready: readyCount,
        deployed: deployedCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('💥 Error in manual account loading:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}