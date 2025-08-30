import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { getMeta, getSuspendedFromCache } from '@/lib/mcc-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.refreshToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mccId = searchParams.get('mccId')
    if (!mccId) return NextResponse.json({ error: 'MCC ID is required' }, { status: 400 })

    const meta = await getMeta(mccId, 'suspended')
    const suspendedAccounts = (await getSuspendedFromCache(mccId)).filter(a => !a.isCanceled)

    return NextResponse.json({
      success: true,
      mccId,
      suspendedAccounts,
      meta,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to read cache' }, { status: 500 })
  }
}

