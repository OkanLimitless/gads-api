import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'
import { getAllFromCache, upsertAccounts } from '@/lib/mcc-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const mccId: string | undefined = body?.mccId || url.searchParams.get('mccId') || undefined
    const vercelCronHeader = request.headers.get('x-vercel-cron') || request.headers.get('X-Vercel-Cron')
    const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const token = body?.token || url.searchParams.get('token') || bearer
    const cronSecret = process.env.CRON_SECRET
    const isCronAuthorized = Boolean(vercelCronHeader || (cronSecret && token && token === cronSecret))
    const refreshToken = session?.refreshToken || process.env.GOOGLE_ADS_REFRESH_TOKEN
    if (!refreshToken) {
      if (!isCronAuthorized) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Missing GOOGLE_ADS_REFRESH_TOKEN for background refresh' }, { status: 500 })
    }
    const limit = Math.max(1, Math.min(5, Number(body?.concurrency) || 3))
    if (!mccId) return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })

    const accounts = await getAllFromCache(mccId)
    if (!accounts || accounts.length === 0) return NextResponse.json({ success: true, updated: 0 })

    // Skip accounts updated within the last 24h
    const now = Date.now()
    const twentyFourHoursMs = 24 * 60 * 60 * 1000
    const stale = accounts.filter(a => {
      const ts = a.campaignCountUpdatedAt ? Date.parse(a.campaignCountUpdatedAt) : 0
      return !ts || (now - ts) > twentyFourHoursMs
    })
    if (stale.length === 0) return NextResponse.json({ success: true, updated: 0, skipped: accounts.length })

    const googleAdsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })

    const queue = [...stale]
    let inFlight = 0
    let updated = 0
    const results: any[] = []

    const runNext = async (): Promise<void> => {
      if (queue.length === 0) return
      if (inFlight >= limit) return
      const acc = queue.shift()!
      inFlight++
      ;(async () => {
        try {
          const customer = googleAdsClient.Customer({
            customer_id: acc.accountId,
            refresh_token: refreshToken!,
            login_customer_id: mccId,
          })
          const rows = await customer.query(`SELECT campaign.id FROM campaign LIMIT 500`)
          const campaignCount = Array.isArray(rows) ? rows.length : 0
          const now = new Date().toISOString()
          await upsertAccounts(mccId, [{ ...acc, campaignCount, campaignCountUpdatedAt: now }])
          updated++
          results.push({ accountId: acc.accountId, ok: true, campaignCount })
        } catch (e: any) {
          results.push({ accountId: acc.accountId, ok: false, error: e?.message || String(e) })
        } finally {
          inFlight--
          await runNext()
        }
      })()
      if (inFlight < limit && queue.length > 0) await runNext()
    }

    const starters = Math.min(limit, queue.length)
    await Promise.all(new Array(starters).fill(0).map(() => runNext()))
    // Wait until all in-flight jobs complete
    while (inFlight > 0) {
      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ success: true, mccId, updated, results: results.slice(0, 20) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to refresh campaign counts' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Allow cron to trigger via GET
  return POST(request)
}

