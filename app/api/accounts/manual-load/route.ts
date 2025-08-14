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
          
          // Smart dummy campaign detection based on budget and campaign count
          if (campaigns.length === 1) {
            // If there's only 1 campaign with ≤€10 daily budget, it's likely a dummy
            const singleCampaign = campaigns[0]
            const dailyBudget = singleCampaign.budget || 0
            
            if (dailyBudget <= 10) {
              // Single campaign with low budget = dummy campaign
              dummyCampaignCount = 1
              realCampaignCount = 0
              hasRealCampaigns = false
              console.log(`🎭 Single dummy campaign detected: "${singleCampaign.name}" (€${dailyBudget}/day budget)`)
            } else {
              // Single campaign with high budget = real campaign
              dummyCampaignCount = 0
              realCampaignCount = 1
              hasRealCampaigns = true
              console.log(`💼 Single real campaign detected: "${singleCampaign.name}" (€${dailyBudget}/day budget)`)
            }
          } else if (campaigns.length > 1) {
            // Multiple campaigns = at least one is likely real
            // Count campaigns with ≤€10 budget as dummy, others as real
            const dummyCampaigns = campaigns.filter(c => (c.budget || 0) <= 10)
            const realCampaigns = campaigns.filter(c => (c.budget || 0) > 10)
            
            dummyCampaignCount = dummyCampaigns.length
            realCampaignCount = realCampaigns.length
            hasRealCampaigns = realCampaignCount > 0
            
            console.log(`📊 Multiple campaigns: ${dummyCampaigns.length} dummy (≤€10), ${realCampaigns.length} real (>€10)`)
            if (dummyCampaigns.length > 0) {
              console.log(`🎭 Dummy campaigns:`, dummyCampaigns.map(c => `${c.name} (€${c.budget}/day)`))
            }
            if (realCampaigns.length > 0) {
              console.log(`💼 Real campaigns:`, realCampaigns.map(c => `${c.name} (€${c.budget}/day)`))
            }
          } else {
            // No campaigns
            dummyCampaignCount = 0
            realCampaignCount = 0
            hasRealCampaigns = false
            console.log(`📊 Account ${accountId}: No campaigns found`)
          }
          
          console.log(`📊 Account ${accountId}: Found ${campaigns.length} total campaigns (${dummyCampaignCount} dummy, ${realCampaignCount} real)`)
        } catch (campaignError) {
          console.error(`💥 Error checking campaigns for account ${accountId}:`, campaignError)
          // If we can't check campaigns, assume account is ready (better to show than hide)
          hasRealCampaigns = false
        }

        // 🛠️ MANUAL DEPLOYMENT MODE 🛠️
        // Allow ANY accessible account to be used for campaign creation,
        // regardless of existing campaigns. Useful for manual campaign deployment.
        const TESTING_MODE = true // ✅ ENABLED - Manual campaign deployment tool
        
        if (TESTING_MODE) {
          console.log(`🛠️ MANUAL DEPLOYMENT: Account ${accountId} forced to 'ready' status for manual campaign creation`)
          results.push({
            id: accountId,
            name: accountInfo.name || `Account ${accountId}`,
            status: 'ready',
            hasRealCampaigns: hasRealCampaigns,
            error: hasRealCampaigns 
              ? `⚠️ TESTING: Has ${realCampaignCount} real campaign${realCampaignCount !== 1 ? 's' : ''} (normally would be blocked)`
              : (dummyCampaignCount > 0 ? `${dummyCampaignCount} dummy campaign${dummyCampaignCount !== 1 ? 's' : ''} detected (ignored)` : undefined)
          })
        } else if (hasRealCampaigns) {
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
    console.log(`🧪 TESTING MODE ENABLED: All accessible accounts are marked as 'ready' for campaign creation testing`)

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