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
    const errorDescription = searchParams.get('error_description')
    const state = searchParams.get('state')

    console.log('OAuth callback received:', { 
      hasCode: !!code, 
      error, 
      errorDescription,
      state 
    })

    if (error) {
      console.error('OAuth error:', error, errorDescription)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/dashboard?error=oauth_error&details=${encodeURIComponent(error + ': ' + (errorDescription || ''))}`)
    }

    if (!code) {
      console.error('No authorization code received')
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/dashboard?error=no_code`)
    }

    try {
      console.log('Attempting token exchange...')
      const tokens = await exchangeCodeForTokens(code)
      
      if (!tokens.refresh_token) {
        console.error('No refresh token received - user may need to re-authorize with consent')
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
        return NextResponse.redirect(`${baseUrl}/dashboard?error=no_refresh_token`)
      }
      
      // In a real app, you'd store these tokens securely (database, session, etc.)
      // For demo purposes, we'll redirect with the tokens as URL params (NOT recommended for production)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
      const redirectUrl = new URL('/dashboard', baseUrl)
      redirectUrl.searchParams.set('access_token', tokens.access_token)
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)
      redirectUrl.searchParams.set('auth_success', 'true')

      console.log('OAuth flow completed successfully, redirecting to dashboard')
      return NextResponse.redirect(redirectUrl.toString())
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error'
      return NextResponse.redirect(`${baseUrl}/dashboard?error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}`)
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/dashboard?error=callback_error`)
  }
}