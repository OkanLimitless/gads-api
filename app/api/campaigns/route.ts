import { NextRequest, NextResponse } from 'next/server'
import { getCampaigns, createCampaign, updateCampaign } from '@/lib/google-ads-client'
import { getCampaigns as getMockCampaigns, createCampaign as createMockCampaign } from '@/lib/google-ads'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const refreshToken = searchParams.get('refresh_token')
    
    // If we have real tokens, use the real API
    if (customerId && refreshToken) {
      try {
        const campaigns = await getCampaigns(customerId, refreshToken)
        return NextResponse.json({ campaigns, source: 'google_ads_api' })
      } catch (error) {
        console.error('Google Ads API error, falling back to mock data:', error)
        // Fall back to mock data if API fails
        const campaigns = await getMockCampaigns(customerId)
        return NextResponse.json({ campaigns, source: 'mock_data', api_error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    // Default to mock data for demo purposes
    const campaigns = await getMockCampaigns('123-456-7890')
    return NextResponse.json({ campaigns, source: 'mock_data' })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, refreshToken, ...campaignData } = body
    
    // If we have real tokens, use the real API
    if (customerId && refreshToken) {
      try {
        const newCampaign = await createCampaign(customerId, refreshToken, campaignData)
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
    const { customerId, refreshToken, campaignId, ...updates } = body
    
    // If we have real tokens, use the real API
    if (customerId && refreshToken && campaignId) {
      try {
        const updatedCampaign = await updateCampaign(customerId, refreshToken, campaignId, updates)
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