import { NextRequest, NextResponse } from 'next/server'
import { getKeywords, createKeyword } from '@/lib/google-ads'

// Force dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || '123-456-7890'
    const adGroupId = searchParams.get('adGroupId')
    
    const keywords = await getKeywords(customerId, adGroupId)
    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Error fetching keywords:', error)
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, ...keywordData } = body
    
    const newKeyword = await createKeyword(customerId || '123-456-7890', keywordData)
    return NextResponse.json({ keyword: newKeyword })
  } catch (error) {
    console.error('Error creating keyword:', error)
    return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 })
  }
}