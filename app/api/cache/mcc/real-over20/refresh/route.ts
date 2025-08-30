import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { getAllFromCache, upsertAccounts } from '@/lib/mcc-cache'
import { getCampaigns } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const mccId: string | undefined = body?.mccId || url.searchParams.get('mccId') || undefined
    if (!mccId) return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })

    const vercelCronHeader = request.headers.get('x-vercel-cron') || request.headers.get('X-Vercel-Cron')
    const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const token = body?.token || url.searchParams.get('token') || bearer
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = Boolean(vercelCronHeader || (cronSecret && token && token === cronSecret))
    const refreshToken = session?.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN
    if (!refreshToken) {
      if (!isCronAuthorized) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      return NextResponse.json({ error: 'Missing GOOGLE_ADS_REFRESH_TOKEN for background refresh' }, { status: 500 })
    }

    const accounts = await getAllFromCache(mccId)
    const enabled = accounts.filter(a => a.status === 'ENABLED')
    const concurrency = Math.max(1, Math.min(10, Number(body?.concurrency) || 8))
    const queue = [...enabled]
    let inFlight = 0
    let updated = 0

    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return
      if (inFlight >= concurrency) return
      const acc = queue.shift()!
      inFlight++
      ;(async () => {
        try {
          const allCampaigns = await getCampaigns(acc.accountId, refreshToken)
          // Determine dummy IDs from cache is not available here; we conservatively treat all campaigns as candidates
          const hasRealOver20 = allCampaigns.some(c => (typeof c.budget === 'number') && c.budget > 20)
          await upsertAccounts(mccId, [{ ...acc, hasRealCampaignOver20: hasRealOver20, lastRealCheckAt: new Date().toISOString() }])
          updated++
        } catch (e) {
          await upsertAccounts(mccId, [{ ...acc, hasRealCampaignOver20: acc.hasRealCampaignOver20 ?? false, lastRealCheckAt: new Date().toISOString() }])
        } finally {
          inFlight--
          await runNext()
        }
      })()
      if (inFlight < concurrency && queue.length > 0) await runNext()
    }

    const starters = Math.min(concurrency, queue.length)
    await Promise.all(new Array(starters).fill(0).map(() => runNext()))
    while (inFlight > 0) { await new Promise(r => setTimeout(r, 50)) }

    return NextResponse.json({ success: true, updated, total: enabled.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to refresh real campaign over20 flags' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

