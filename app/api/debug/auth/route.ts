import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      } : null,
      tokens: {
        hasAccessToken: !!session?.accessToken,
        hasRefreshToken: !!session?.refreshToken,
        accessTokenLength: session?.accessToken?.length || 0,
        refreshTokenLength: session?.refreshToken?.length || 0,
        error: session?.error
      },
      environment: {
        hasClientId: !!process.env.GOOGLE_ADS_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
        hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      error: 'Failed to get auth debug info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}