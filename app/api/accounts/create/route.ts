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

    // Hardcoded MCC ID as requested
    const mccId = '1284928552'

    // Optional: number of accounts to create (default 1)
    const countRaw = body?.count
    let count = Number(countRaw)
    if (!Number.isFinite(count) || count < 1) count = 1
    if (count > 20) count = 20 // safety cap

    const customerIds: string[] = []
    for (let i = 0; i < count; i++) {
      const { customerId } = await createCustomerClientUnderMcc(mccId, session.refreshToken, {
        currencyCode: 'EUR',
        timeZone: 'Europe/Amsterdam',
        descriptiveName: `Client ${new Date().toISOString()}`,
      })
      customerIds.push(customerId)
    }

    return NextResponse.json({ success: true, customerIds })
  } catch (error: any) {
    console.error('Error creating customer client(s):', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}