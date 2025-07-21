import { NextRequest, NextResponse } from 'next/server'
import { getCampaigns, createCampaign } from '@/lib/google-ads'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || '123-456-7890'
    
    const campaigns = await getCampaigns(customerId)
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, ...campaignData } = body
    
    const newCampaign = await createCampaign(customerId || '123-456-7890', campaignData)
    return NextResponse.json({ campaign: newCampaign })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}