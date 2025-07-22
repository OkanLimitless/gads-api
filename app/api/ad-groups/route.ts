import { NextRequest, NextResponse } from 'next/server'
import { getAdGroups, createAdGroup } from '@/lib/google-ads'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || '123-456-7890'
    const campaignId = searchParams.get('campaignId')
    
    const adGroups = await getAdGroups(customerId, campaignId)
    return NextResponse.json({ adGroups })
  } catch (error) {
    console.error('Error fetching ad groups:', error)
    return NextResponse.json({ error: 'Failed to fetch ad groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, ...adGroupData } = body
    
    const newAdGroup = await createAdGroup(customerId || '123-456-7890', adGroupData)
    return NextResponse.json({ adGroup: newAdGroup })
  } catch (error) {
    console.error('Error creating ad group:', error)
    return NextResponse.json({ error: 'Failed to create ad group' }, { status: 500 })
  }
}