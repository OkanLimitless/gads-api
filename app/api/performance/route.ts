import { NextRequest, NextResponse } from 'next/server'
import { getCampaignPerformance } from '@/lib/google-ads-client'

// Mock performance data for fallback
const generateMockPerformance = (campaignId: string, campaignName: string, days: number = 30) => {
  const performance = []
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    performance.push({
      campaignId,
      campaignName,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      cost: Math.floor(Math.random() * 1000) + 100,
      ctr: (Math.random() * 5 + 2).toFixed(2),
      averageCpc: (Math.random() * 2 + 0.5).toFixed(2),
      conversions: Math.floor(Math.random() * 20) + 1,
      conversionRate: (Math.random() * 10 + 2).toFixed(2),
      costPerConversion: (Math.random() * 50 + 10).toFixed(2),
      date: date.toISOString().split('T')[0],
    })
  }
  
  return performance
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const refreshToken = searchParams.get('refresh_token')
    const startDate = searchParams.get('startDate') || '2024-01-01'
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const campaignIds = searchParams.get('campaignIds')?.split(',')
    
    // If we have real tokens, use the real API
    if (customerId && refreshToken) {
      try {
        const performance = await getCampaignPerformance(customerId, refreshToken, {
          startDate,
          endDate,
        })
        
        // Filter by campaign IDs if provided
        const filteredPerformance = campaignIds 
          ? performance.filter(p => campaignIds.includes(p.campaignId))
          : performance
        
        return NextResponse.json({ 
          performance: filteredPerformance, 
          source: 'google_ads_api',
          dateRange: { startDate, endDate }
        })
      } catch (error) {
        console.error('Google Ads API error, falling back to mock performance data:', error)
        
        // Generate mock performance data
        const mockPerformance = campaignIds 
          ? campaignIds.flatMap(id => generateMockPerformance(id, `Campaign ${id}`, 30))
          : [
              ...generateMockPerformance('1', 'Search Campaign', 30),
              ...generateMockPerformance('2', 'Display Campaign', 30),
              ...generateMockPerformance('3', 'Shopping Campaign', 30),
            ]
        
        return NextResponse.json({ 
          performance: mockPerformance, 
          source: 'mock_data',
          dateRange: { startDate, endDate },
          api_error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Default to mock performance data for demo purposes
    const mockPerformance = campaignIds 
      ? campaignIds.flatMap(id => generateMockPerformance(id, `Campaign ${id}`, 30))
      : [
          ...generateMockPerformance('1', 'Search Campaign', 30),
          ...generateMockPerformance('2', 'Display Campaign', 30),
          ...generateMockPerformance('3', 'Shopping Campaign', 30),
        ]
    
    return NextResponse.json({ 
      performance: mockPerformance, 
      source: 'mock_data',
      dateRange: { startDate, endDate }
    })
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}