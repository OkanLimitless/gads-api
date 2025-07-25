import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/adwords openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('🔄 JWT Callback:', {
        hasAccount: !!account,
        hasToken: !!token,
        accountProvider: account?.provider,
        accountType: account?.type,
        tokenHasRefresh: !!token.refreshToken,
        tokenHasAccess: !!token.accessToken
      })

      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        console.log('💾 Storing new tokens from account:', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          scope: account.scope,
          expiresAt: account.expires_at
        })
        
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number) * 1000) {
        console.log('✅ Token still valid, returning existing token')
        return token
      }

      // Access token has expired, try to update it
      console.log('🔄 Token expired, attempting refresh...')
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      console.log('📋 Session Callback:', {
        hasSession: !!session,
        hasToken: !!token,
        tokenHasRefresh: !!token.refreshToken,
        tokenHasAccess: !!token.accessToken,
        tokenError: token.error
      })

      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.error = token.error as string
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/dashboard',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

async function refreshAccessToken(token: any) {
  try {
    console.log('🔄 Refreshing access token...')
    const url = 'https://oauth2.googleapis.com/token'
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error('❌ Token refresh failed:', refreshedTokens)
      throw refreshedTokens
    }

    console.log('✅ Token refresh successful:', {
      hasAccessToken: !!refreshedTokens.access_token,
      hasRefreshToken: !!refreshedTokens.refresh_token,
      expiresIn: refreshedTokens.expires_in
    })

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error('💥 Token refresh error:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }