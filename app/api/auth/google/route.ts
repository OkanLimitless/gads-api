import { NextRequest, NextResponse } from 'next/server'
import { getOAuthUrl } from '@/lib/google-ads-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || undefined
    
    const oauthUrl = getOAuthUrl(state)
    
    return NextResponse.redirect(oauthUrl)
  } catch (error) {
    console.error('Error initiating OAuth:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}