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

        // Check for existing campaigns and distinguish dummy vs real campaigns
        let hasRealCampaigns = false
        let dummyCampaignCount = 0
        let realCampaignCount = 0
        
        try {
          const campaigns = await getCampaigns(accountId, session.refreshToken)
          
          // Identify dummy campaigns by name patterns
          const dummyCampaigns = campaigns.filter(campaign => {
            const name = campaign.name.toLowerCase()
            // Common dummy campaign name patterns
            return name.includes('dummy') || 
                   name.includes('test') ||
                   name.includes('template') ||
                   name.match(/\d{4}-\d{2}-\d{2}$/) || // Ends with date (YYYY-MM-DD)
                   name.includes('sweaters and hoodies') ||
                   name.includes('clothing sale') ||
                   name.includes('push up bra') ||
                   name.includes('energie') // Template names from our system
          })
          
          dummyCampaignCount = dummyCampaigns.length
          realCampaignCount = campaigns.length - dummyCampaignCount
          hasRealCampaigns = realCampaignCount > 0
          
          console.log(`📊 Account ${accountId}: Found ${campaigns.length} total campaigns (${dummyCampaignCount} dummy, ${realCampaignCount} real)`)
          
          if (dummyCampaigns.length > 0) {
            console.log(`🎭 Dummy campaigns detected:`, dummyCampaigns.map(c => c.name))
          }
        } catch (campaignError) {
          console.error(`💥 Error checking campaigns for account ${accountId}:`, campaignError)
          // If we can't check campaigns, assume account is ready (better to show than hide)
          hasRealCampaigns = false
        }

        if (hasRealCampaigns) {
          console.log(`❌ Account ${accountId}: Has ${realCampaignCount} real campaigns - marked as deployed`)
          results.push({
            id: accountId,
            name: accountInfo.name || `Account ${accountId}`,
            status: 'campaign-deployed',
            hasRealCampaigns: true,
            error: `Has ${realCampaignCount} real campaign${realCampaignCount !== 1 ? 's' : ''} (${dummyCampaignCount} dummy ignored)`
          })
        } else {
          console.log(`✅ Account ${accountId}: Only ${dummyCampaignCount} dummy campaigns found - ready for deployment`)
          results.push({
            id: accountId,
            name: accountInfo.name || `Account ${accountId}`,
            status: 'ready',
            hasRealCampaigns: false,
            error: dummyCampaignCount > 0 ? `${dummyCampaignCount} dummy campaign${dummyCampaignCount !== 1 ? 's' : ''} detected (ignored)` : undefined
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