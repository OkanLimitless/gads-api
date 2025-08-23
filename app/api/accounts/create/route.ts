import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createCustomerClientUnderMcc } from '@/lib/google-ads-client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.refreshToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const mccIdRaw: string | undefined = body?.mccId
    const mccId = (mccIdRaw || '').replace(/[^0-9]/g, '')

    if (!mccId) {
      return NextResponse.json({ success: false, error: 'mccId is required' }, { status: 400 })
    }

    const { customerId } = await createCustomerClientUnderMcc(mccId, session.refreshToken, {
      currencyCode: 'EUR',
      timeZone: 'Europe/Amsterdam',
      descriptiveName: `Client ${new Date().toISOString()}`,
    })

    // Build Preferences link (deep-link into Ads UI)
    const buildPreferencesLink = (cid: string, managerId?: string) => {
      const cleanCid = (cid || '').replace(/[^0-9]/g, '')
      const cleanMcc = (managerId || '').replace(/[^0-9]/g, '')
      const params = new URLSearchParams({ ocid: cleanCid, __c: cleanCid, authuser: '0' })
      if (cleanMcc) params.set('ascid', cleanMcc)
      return `https://ads.google.com/aw/preferences?${params.toString()}`
    }

    const preferencesUrl = buildPreferencesLink(customerId, mccId)

    return NextResponse.json({ success: true, customerId, preferencesUrl })
  } catch (error: any) {
    console.error('Error creating customer client:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}