import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { getDummyCampaignTrackingCollection } from '@/lib/mongodb'
import { updateDummyCampaignPerformance } from '@/lib/dummy-campaign-tracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function getDistinctAccountIds(): Promise<string[]> {
  const col = await getDummyCampaignTrackingCollection()
  const ids = await col.distinct('accountId')
  return (ids as string[]).filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.refreshToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const onlyAccounts: string[] | undefined = Array.isArray(body?.accountIds) ? body.accountIds : undefined
    const concurrency = Math.max(1, Math.min(10, Number(body?.concurrency) || 6))

    const accountIds = onlyAccounts && onlyAccounts.length > 0 ? onlyAccounts : await getDistinctAccountIds()
    if (accountIds.length === 0) return NextResponse.json({ success: true, updated: 0 })

    let inFlight = 0
    let updated = 0
    const queue = [...accountIds]
    const results: Array<{ accountId: string; ok: boolean; error?: string }> = []

    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return
      if (inFlight >= concurrency) return
      const accountId = queue.shift()!
      inFlight++
      ;(async () => {
        try {
          await updateDummyCampaignPerformance(accountId, session.refreshToken!)
          updated++
          results.push({ accountId, ok: true })
        } catch (e: any) {
          results.push({ accountId, ok: false, error: e?.message || String(e) })
        } finally {
          inFlight--
          await runNext()
        }
      })()
      if (inFlight < concurrency && queue.length > 0) await runNext()
    }

    const starters = Math.min(concurrency, queue.length)
    await Promise.all(new Array(starters).fill(0).map(() => runNext()))
    while (inFlight > 0) {
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ success: true, updated, total: accountIds.length, results: results.slice(0, 20) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to refresh dummy performance' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Allow cron to trigger via GET as well
  return POST(request)
}

