import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'
import { upsertAccounts, setMeta } from '@/lib/mcc-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const body = await request.json().catch(() => ({}))
    const mccId: string | undefined = body?.mccId || url.searchParams.get('mccId') || undefined

    // Allow Vercel Cron or token-based auth when no session
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
    if (!mccId) {
      return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })
    }

    await setMeta(mccId, 'suspended', { status: 'running', startedAt: new Date().toISOString(), error: undefined })

    const googleAdsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })

    const mccCustomerClient = googleAdsClient.Customer({
      customer_id: mccId,
      refresh_token: refreshToken,
    })

    const clientsQuery = `
      SELECT 
        customer_client.client_customer,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.status,
        customer_client.test_account,
        customer_client.manager,
        customer_client.level
      FROM customer_client
      WHERE customer_client.level = 1
      AND customer_client.manager = false
    `

    const rows: any[] = await mccCustomerClient.query(clientsQuery)

    const STATUS_MAP: Record<number, string> = { 0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'CANCELED', 4: 'SUSPENDED' }
    const asText = (s: any) => typeof s === 'string' ? s : (typeof s === 'number' ? (STATUS_MAP[s] || 'UNKNOWN') : 'UNKNOWN')

    const cachedRows = rows.map((r: any) => {
      const c = r.customer_client
      const accountId = (c.client_customer?.split('/')?.[1]) || 'unknown'
      const statusText = asText(c.status)
      return {
        mccId,
        accountId,
        name: c.descriptive_name || `Client Account ${accountId}`,
        currency: c.currency_code || 'USD',
        timeZone: c.time_zone || 'UTC',
        status: statusText,
        testAccount: c.test_account || false,
        level: c.level || 1,
        isSuspended: statusText === 'SUSPENDED' || statusText === 'CANCELED',
      }
    })

    await upsertAccounts(mccId, cachedRows)

    const counts = {
      total: cachedRows.length,
      suspended: cachedRows.filter(x => x.isSuspended).length,
      enabled: cachedRows.filter(x => x.status === 'ENABLED').length,
    }

    await setMeta(mccId, 'suspended', { status: 'complete', completedAt: new Date().toISOString(), counts })

    return NextResponse.json({ success: true, mccId, counts })
  } catch (error: any) {
    try {
      const { searchParams } = new URL(request.url)
      const mccId = searchParams.get('mccId') || undefined
      if (mccId) await setMeta(mccId, 'suspended', { status: 'error', completedAt: new Date().toISOString(), error: error?.message || String(error) })
    } catch {}
    return NextResponse.json({ success: false, error: error?.message || 'Failed to refresh cache' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Allow cron to trigger refresh via GET for convenience
  return POST(request)
}

