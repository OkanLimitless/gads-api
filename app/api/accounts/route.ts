import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getAccessibleCustomers } from '@/lib/google-ads-client'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Accounts API called')
    
    const session = await getServerSession(authOptions)
    console.log('📋 Session check:', {
      hasSession: !!session,
      hasRefreshToken: !!session?.refreshToken,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
      error: session?.error
    })
    
    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (session.error === 'RefreshAccessTokenError') {
      console.log('❌ Token refresh error')
      return NextResponse.json({ error: 'Token refresh failed. Please re-authenticate.' }, { status: 401 })
    }

    console.log('🚀 Attempting to fetch Google Ads accounts...')
    console.log('🔑 Using refresh token:', session.refreshToken ? 'Present' : 'Missing')
    
    const accounts = await getAccessibleCustomers(session.refreshToken)
    
    console.log('✅ Successfully fetched accounts:', {
      count: accounts.length,
      accounts: accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        isManager: acc.isManager,
        canManageCampaigns: acc.canManageCampaigns
      }))
    })
    
    return NextResponse.json({ 
      accounts,
      totalAccounts: accounts.length,
      managerAccounts: accounts.filter(acc => !acc.canManageCampaigns).length,
      clientAccounts: accounts.filter(acc => acc.canManageCampaigns).length,
      debug: {
        sessionUser: session.user?.email,
        tokenPresent: !!session.refreshToken,
        accountsFetched: accounts.length
      }
    })
  } catch (error) {
    console.error('💥 Error fetching accounts:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ 
      error: 'Failed to fetch accounts',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}