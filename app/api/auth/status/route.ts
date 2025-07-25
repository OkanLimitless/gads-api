import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/route'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        error: null
      })
    }
    
    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ 
        authenticated: false,
        error: 'Token refresh failed. Please re-authenticate.'
      })
    }
    
    return NextResponse.json({ 
      authenticated: true,
      user: {
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image
      },
      hasRefreshToken: !!session.refreshToken,
      error: null
    })
  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Failed to check authentication status'
    }, { status: 500 })
  }
}