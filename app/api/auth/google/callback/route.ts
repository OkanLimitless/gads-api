import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-ads-client'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const state = searchParams.get('state')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=oauth_error`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_code`)
    }

    try {
      const tokens = await exchangeCodeForTokens(code)
      
      // In a real app, you'd store these tokens securely (database, session, etc.)
      // For now, we'll redirect with the tokens as URL params (NOT recommended for production)
      const redirectUrl = new URL('/dashboard', process.env.NEXTAUTH_URL!)
      redirectUrl.searchParams.set('access_token', tokens.access_token)
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
      redirectUrl.searchParams.set('auth_success', 'true')

      return NextResponse.redirect(redirectUrl.toString())
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`)
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=callback_error`)
  }
}