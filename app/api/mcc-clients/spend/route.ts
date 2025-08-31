import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getClientAccounts } from '@/lib/google-ads-client'
import { getCampaignPerformance } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.refreshToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mccId = searchParams.get('mccId') || '1284928552'
    const startParam = searchParams.get('start') // YYYY-MM-DD
    const endParam = searchParams.get('end') // YYYY-MM-DD
    const minParam = Number(searchParams.get('min') || '1')
    const maxParam = Number(searchParams.get('max') || '100')

    const now = new Date()
    const defaultStart = new Date(now)
    defaultStart.setDate(now.getDate() - 29)
    const fmt = (d: Date) => d.toISOString().split('T')[0]
    const startDate = startParam || fmt(defaultStart)
    const endDate = endParam || fmt(now)

    console.log(`📊 Spend evaluator: MCC ${mccId}, window ${startDate}..${endDate}, range €${minParam}-€${maxParam}`)

    // 1) Get MCC children (level 1, manager=false)
    const accounts = await getClientAccounts(mccId, session.refreshToken)

    // 2) ENABLED filter (handle string or numeric status)
    const enabledAccounts = accounts.filter((acc: any) => acc.status === 'ENABLED' || acc.status === 2)
    console.log(`ℹ️ Spend evaluator: ${enabledAccounts.length} ENABLED accounts`)

    // 3) Per-account spend; concurrency limited
    const concurrency = 8
    const queue = [...enabledAccounts]
    const results: Array<{ accountId: string; accountName: string; spend: number }> = []
    let inFlight = 0

    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return
      if (inFlight >= concurrency) return
      const acc = queue.shift()!
      inFlight++
      ;(async () => {
        try {
          const perf = await getCampaignPerformance(acc.id, session.refreshToken!, { startDate, endDate })
          const total = perf.reduce((s, row) => s + (row.cost || 0), 0)
          results.push({ accountId: acc.id, accountName: acc.name, spend: total })
        } catch (e) {
          // Skip account on error
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

    // 4) Filter by spend range [min, max]
    const filtered = results.filter(r => r.spend >= minParam && r.spend <= maxParam)
    // Sort by spend desc for convenience
    filtered.sort((a, b) => b.spend - a.spend)

    console.log(`✅ Spend evaluator: ${filtered.length}/${enabledAccounts.length} accounts match range`)

    return NextResponse.json({
      success: true,
      mccId,
      startDate,
      endDate,
      min: minParam,
      max: maxParam,
      totalEvaluated: enabledAccounts.length,
      matches: filtered.length,
      accounts: filtered.map(r => ({
        accountId: r.accountId,
        accountName: r.accountName,
        spend: Number(r.spend.toFixed(2))
      }))
    })
  } catch (error: any) {
    console.error('💥 Error computing MCC spend range:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to compute MCC spend' }, { status: 500 })
  }
}

