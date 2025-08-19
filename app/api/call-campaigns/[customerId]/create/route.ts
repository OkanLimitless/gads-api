import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { createCallOnlyCampaign } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { customerId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { customerId } = params
    const body = await request.json()
    const { campaignData } = body

    if (!customerId || !campaignData) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ success: false, error: 'Token refresh failed. Please re-authenticate.' }, { status: 401 })
    }

    const result = await createCallOnlyCampaign(customerId, session.refreshToken!, campaignData)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to create call-only campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('💥 Error in call-only campaign creation route:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

