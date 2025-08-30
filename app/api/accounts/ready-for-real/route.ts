import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAccountsReadyForRealCampaigns, updateDummyCampaignPerformance, cleanupStaleAccountData } from '@/lib/dummy-campaign-tracker'
import { getClientAccounts } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching accounts ready for real campaigns')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const updatePerformance = false // disable live updates on GET; use background refresh
    const cleanupStale = searchParams.get('cleanupStale') === 'true'

    // Get client accounts from MCC
    const knownMCCId = '1284928552'
    const clientAccounts = await getClientAccounts(knownMCCId, session.refreshToken)
    
    let readyAccounts = []
    let performanceUpdated = 0
    let cleanupResult = null

    // Trigger background refresh instead of blocking GET
    fetch(`/api/cache/dummy/performance/refresh`, { method: 'POST' }).catch(() => {})

    // Optional cleanup of stale account data
    if (cleanupStale) {
      console.log('🧹 Cleaning up stale account data...')
      const validAccountIds = clientAccounts.map(acc => acc.id)
      cleanupResult = await cleanupStaleAccountData(validAccountIds)
      console.log(`✅ Cleanup completed: removed ${cleanupResult.removedCampaigns} campaigns from ${cleanupResult.affectedAccounts.length} stale accounts`)
    }

    // Get accounts that are ready for real campaigns (with real campaign filtering)
    // Use cache-based filtering to avoid GAQL per-account fetches
    readyAccounts = await getAccountsReadyForRealCampaigns(session.refreshToken, { useCacheCounts: true, mccId: knownMCCId })
    
    // Filter out accounts that are no longer available in the MCC (suspended/removed accounts)
    // Consider only accounts that exist in current MCC (allow any status for visibility)
    const mccIds = new Set(clientAccounts.map(acc => acc.id))
    const availableReadyAccounts = readyAccounts.filter(readyAccount => {
      const inMcc = mccIds.has(readyAccount.accountId)
      if (!inMcc) {
        console.log(`⚠️ Filtering out account ${readyAccount.accountId}: Not found in MCC (likely suspended/removed)`)      
      }
      return inMcc
    })
    
    console.log(`🔍 Filtered accounts: ${availableReadyAccounts.length}/${readyAccounts.length} accounts are still available in MCC`)
    
    // Enrich with account names from Google Ads
    const enrichedAccounts = availableReadyAccounts.map(readyAccount => {
      const gadsAccount = clientAccounts.find(acc => acc.id === readyAccount.accountId) as any
      return {
        ...readyAccount,
        accountName: gadsAccount?.name || `Account ${readyAccount.accountId}`,
        descriptiveName: gadsAccount?.descriptive_name || gadsAccount?.name || `Account ${readyAccount.accountId}`,
        status: gadsAccount?.status || 'UNKNOWN',
      }
    })

    console.log(`✅ Found ${enrichedAccounts.length} accounts ready for real campaigns`)

    return NextResponse.json({
      success: true,
      readyAccounts: enrichedAccounts,
      totalReadyAccounts: enrichedAccounts.length,
      performanceUpdated: updatePerformance ? performanceUpdated : null,
      cleanupResult: cleanupStale ? cleanupResult : null,
      filteredAccounts: readyAccounts.length - availableReadyAccounts.length,
      criteria: {
        minimumSpend: '€10.00',
        timeframe: '7 days',
        description: 'Accounts with dummy campaigns that have spent over €10 in the last 7 days AND have no real campaigns deployed yet'
      }
    })

  } catch (error) {
    console.error('💥 Error fetching accounts ready for real campaigns:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// POST endpoint to manually update performance for specific accounts
export async function POST(request: NextRequest) {
  try {
    console.log('📊 Manual performance update requested')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { accountIds } = await request.json()

    if (!accountIds || !Array.isArray(accountIds)) {
      return NextResponse.json(
        { error: 'accountIds array is required' },
        { status: 400 }
      )
    }

    let updated = 0
    const results = []

    for (const accountId of accountIds) {
      try {
        await updateDummyCampaignPerformance(accountId, session.refreshToken)
        updated++
        results.push({ accountId, success: true })
      } catch (error) {
        console.error(`💥 Error updating performance for account ${accountId}:`, error)
        results.push({ 
          accountId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      total: accountIds.length,
      results
    })

  } catch (error) {
    console.error('💥 Error in manual performance update:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}