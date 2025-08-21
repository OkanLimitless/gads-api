import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getAllCampaignFinalUrls } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mccId = searchParams.get('mccId') || undefined
    const minBudgetEurosParam = searchParams.get('minBudgetEuros')
    const minBudgetEuros = minBudgetEurosParam ? parseFloat(minBudgetEurosParam) : 20

    const results = await getAllCampaignFinalUrls(session.refreshToken!, { mccId, minBudgetEuros })

    return NextResponse.json({ success: true, count: results.length, campaigns: results })
  } catch (error) {
    console.error('💥 Error in final URLs endpoint:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

