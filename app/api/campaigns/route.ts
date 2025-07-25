import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getCampaigns, createCampaign, updateCampaign } from '@/lib/google-ads-client'
import { getCampaigns as getMockCampaigns, createCampaign as createMockCampaign } from '@/lib/google-ads'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    const session = await getServerSession(authOptions)
    
    // If we have a valid session and customer ID, use the real API
    if (session?.refreshToken && customerId && session.error !== 'RefreshAccessTokenError') {
      try {
        const campaigns = await getCampaigns(customerId, session.refreshToken)
        return NextResponse.json({ campaigns, source: 'google_ads_api' })
      } catch (error) {
        console.error('Google Ads API error, falling back to mock data:', error)
        // Fall back to mock data if API fails
        const campaigns = await getMockCampaigns(customerId)
        return NextResponse.json({ campaigns, source: 'mock_data', api_error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    // Default to mock data for demo purposes
    const campaigns = await getMockCampaigns(customerId || '123-456-7890')
    return NextResponse.json({ campaigns, source: 'mock_data' })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, ...campaignData } = body
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    // If we have a valid session and customer ID, use the real API
    if (session.refreshToken && customerId && session.error !== 'RefreshAccessTokenError') {
      try {
        const newCampaign = await createCampaign(customerId, session.refreshToken, campaignData)
        return NextResponse.json({ campaign: newCampaign, source: 'google_ads_api' })
      } catch (error) {
        console.error('Google Ads API error, falling back to mock creation:', error)
        // Fall back to mock creation if API fails
        const newCampaign = await createMockCampaign(customerId, campaignData)
        return NextResponse.json({ campaign: newCampaign, source: 'mock_data', api_error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    // Default to mock creation for demo purposes
    const newCampaign = await createMockCampaign(customerId || '123-456-7890', campaignData)
    return NextResponse.json({ campaign: newCampaign, source: 'mock_data' })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, campaignId, ...updates } = body
    
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ error: 'Token refresh failed. Please re-authenticate.' }, { status: 401 })
    }
    
    // If we have a valid session and required parameters, use the real API
    if (session.refreshToken && customerId && campaignId) {
      try {
        const updatedCampaign = await updateCampaign(customerId, session.refreshToken, campaignId, updates)
        return NextResponse.json({ campaign: updatedCampaign, source: 'google_ads_api' })
      } catch (error) {
        console.error('Google Ads API error:', error)
        return NextResponse.json({ 
          error: 'Failed to update campaign',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}