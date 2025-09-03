import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAccountsReadyForRealCampaigns, updateDummyCampaignPerformance, cleanupStaleAccountData } from '@/lib/dummy-campaign-tracker'
import { getClientAccounts, getCampaigns, getCampaignPerformance } from '@/lib/google-ads-client'

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

    // Cache-first evaluation: start with cached campaign counts and dummy tracking, and only fall back to live for unknowns
    // 1) Start with MCC-present, ENABLED accounts
    const enabledAccounts = clientAccounts.filter((acc: any) => acc.status === 'ENABLED' || acc.status === 2)
    console.log(`ℹ️ Live evaluation: ${enabledAccounts.length} ENABLED accounts`)

    // 2) Use cache-first: filter accounts that have cached counts and dummy readiness
    const { getAccountsReadyForRealCampaigns } = await import('@/lib/dummy-campaign-tracker')
    const readyFromDummy = await getAccountsReadyForRealCampaigns(undefined, { allowedAccountIds: new Set(enabledAccounts.map(a => a.id)) })
    const readyIds = new Set(readyFromDummy.map(a => a.accountId))

    // Fast-return if ready accounts exist
    if (readyFromDummy.length > 0) {
      return NextResponse.json({
        success: true,
        readyAccounts: readyFromDummy.map(r => ({
          accountId: r.accountId,
          accountName: clientAccounts.find(a => a.id === r.accountId)?.name || r.accountId,
          totalSpentLast7Days: r.totalSpentLast7Days,
          campaignCount: r.campaignCount,
          dummyCampaigns: r.dummyCampaigns,
          hasRealCampaigns: false
        })),
        totalReadyAccounts: readyFromDummy.length,
        criteria: {
          minimumSpend: '€10.00',
          timeframe: '30 days',
          description: 'Cache-first: dummy spend readiness and zero real campaigns inferred from cache'
        }
      })
    }

    // Fallback: Live evaluation only for accounts not already ready
    const candidates = enabledAccounts.filter(a => !readyIds.has(a.id))
    const concurrency = 3
    const queue = [...candidates]
    const results: Array<{ accountId: string; accountName: string; dummySpend30d: number; hasRealOver20: boolean }>
      = []
    let inFlight = 0
    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return
      if (inFlight >= concurrency) return
      const acc = queue.shift()!
      inFlight++
      ;(async () => {
        try {
          // Real campaign detection
          const campaigns = await getCampaigns(acc.id, session.refreshToken)
          const hasRealOver20 = campaigns.some(c => typeof c.budget === 'number' && c.budget > 20)

          // Dummy spend over last 30 days across campaigns with budget <= 20
          const now = new Date()
          const start = new Date(now)
          start.setDate(now.getDate() - 29)
          const seven = new Date(now)
          seven.setDate(now.getDate() - 6)
          const fmt = (d: Date) => d.toISOString().split('T')[0]
          const perf = await getCampaignPerformance(acc.id, session.refreshToken, { startDate: fmt(start), endDate: fmt(now) })
          const allowedCampaignIds = new Set(campaigns.filter(c => (c.budget || 0) <= 20).map(c => c.id))
          const dummyRows = perf.filter(p => allowedCampaignIds.has(p.campaignId))
          const dummySpend30d = dummyRows.reduce((s, row) => s + (row.cost || 0), 0)
          const dummySpend7d = dummyRows.filter(r => (r.date || '') >= fmt(seven)).reduce((s, row) => s + (row.cost || 0), 0)
          const dummyCount = allowedCampaignIds.size

          results.push({ accountId: acc.id, accountName: acc.name, dummySpend30d, hasRealOver20, dummySpend7d, dummyCount })
        } catch (e) {
          // On error, skip this account silently
        } finally {
          inFlight--
          await runNext()
        }
      })()
      if (inFlight < concurrency && queue.length > 0) await runNext()
    }
    const starters = Math.min(concurrency, queue.length)
    await Promise.all(new Array(starters).fill(0).map(() => runNext()))
    while (inFlight > 0) { await new Promise(r => setTimeout(r, 25)) }

    // 3) Filter for readiness criteria: dummySpend30d >= 10 and no real campaign > 20
    const ready = results.filter(r => r.dummySpend30d >= 10 && !r.hasRealOver20)

    console.log(`✅ Live ready accounts: ${ready.length}/${candidates.length}`)

    return NextResponse.json({
      success: true,
      readyAccounts: ready.map(r => ({
        accountId: r.accountId,
        accountName: r.accountName,
        totalSpentLast7Days: r.dummySpend7d ?? 0,
        campaignCount: r.dummyCount ?? 0,
        dummyCampaigns: [],
        hasRealCampaigns: r.hasRealOver20
      })),
      totalReadyAccounts: ready.length,
      criteria: {
        minimumSpend: '€10.00',
        timeframe: '30 days',
        description: 'ENABLED accounts with <= €20/day campaigns spending ≥ €10 in last 30 days and no campaign > €20/day'
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