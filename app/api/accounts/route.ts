import { NextRequest, NextResponse } from 'next/server'
import { getAccessibleCustomers } from '@/lib/google-ads-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refreshToken = searchParams.get('refresh_token')

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 })
    }

    const accounts = await getAccessibleCustomers(refreshToken)
    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}