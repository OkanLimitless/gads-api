import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getAccessibleCustomers } from '@/lib/google-ads-client'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.refreshToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ error: 'Token refresh failed. Please re-authenticate.' }, { status: 401 })
    }

    const accounts = await getAccessibleCustomers(session.refreshToken)
    
    return NextResponse.json({ 
      accounts,
      totalAccounts: accounts.length,
      managerAccounts: accounts.filter(acc => !acc.canManageCampaigns).length,
      clientAccounts: accounts.filter(acc => acc.canManageCampaigns).length
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}