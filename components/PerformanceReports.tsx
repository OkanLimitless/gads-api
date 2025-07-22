'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Download, TrendingUp, TrendingDown, Eye, MousePointer, DollarSign, Target } from 'lucide-react'

interface CampaignPerformance {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  cost: number
  ctr: number
  averageCpc: number
  conversions: number
  conversionRate: number
  costPerConversion: number
  date: string
}

interface Campaign {
  id: string
  name: string
  status: string
  budget: number
  biddingStrategy: string
  startDate: string
  endDate?: string
}

interface PerformanceReportsProps {
  customerId?: string
  refreshToken?: string
  campaigns: Campaign[]
}

export default function PerformanceReports({ customerId, refreshToken, campaigns }: PerformanceReportsProps) {
  const [performance, setPerformance] = useState<CampaignPerformance[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])

  useEffect(() => {
    fetchPerformanceData()
  }, [customerId, refreshToken, dateRange])

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      if (customerId) params.set('customerId', customerId)
      if (refreshToken) params.set('refresh_token', refreshToken)
      if (selectedCampaigns.length > 0) {
        params.set('campaignIds', selectedCampaigns.join(','))
      }

      const response = await fetch(`/api/performance?${params.toString()}`)
      const data = await response.json()
      
      setPerformance(data.performance || [])
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate performance data
  const aggregatedData = performance.reduce((acc, curr) => {
    acc.impressions += curr.impressions
    acc.clicks += curr.clicks
    acc.cost += curr.cost
    acc.conversions += curr.conversions
    return acc
  }, { impressions: 0, clicks: 0, cost: 0, conversions: 0 })

  const avgCtr = aggregatedData.impressions > 0 ? (aggregatedData.clicks / aggregatedData.impressions) * 100 : 0
  const avgCpc = aggregatedData.clicks > 0 ? aggregatedData.cost / aggregatedData.clicks : 0
  const conversionRate = aggregatedData.clicks > 0 ? (aggregatedData.conversions / aggregatedData.clicks) * 100 : 0
  const costPerConversion = aggregatedData.conversions > 0 ? aggregatedData.cost / aggregatedData.conversions : 0

  // Group performance by campaign
  const campaignPerformance = performance.reduce((acc, curr) => {
    if (!acc[curr.campaignId]) {
      acc[curr.campaignId] = {
        campaignName: curr.campaignName,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        dates: []
      }
    }
    acc[curr.campaignId].impressions += curr.impressions
    acc[curr.campaignId].clicks += curr.clicks
    acc[curr.campaignId].cost += curr.cost
    acc[curr.campaignId].conversions += curr.conversions
    acc[curr.campaignId].dates.push(curr)
    return acc
  }, {} as any)

  const handleExport = () => {
    const csvContent = [
      ['Campaign', 'Date', 'Impressions', 'Clicks', 'Cost', 'CTR', 'CPC', 'Conversions', 'Conv. Rate', 'Cost/Conv'],
      ...performance.map(p => [
        p.campaignName,
        p.date,
        p.impressions,
        p.clicks,
        p.cost.toFixed(2),
        p.ctr.toFixed(2),
        p.averageCpc.toFixed(2),
        p.conversions,
        p.conversionRate.toFixed(2),
        p.costPerConversion.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${dateRange.startDate}-${dateRange.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-auto"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-auto"
            />
          </div>
          <Button onClick={fetchPerformanceData} disabled={loading}>
            {loading ? 'Loading...' : 'Update'}
          </Button>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Campaign Filter */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter by Campaigns</CardTitle>
            <CardDescription>Select specific campaigns to analyze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCampaigns.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCampaigns([])}
              >
                All Campaigns
              </Button>
              {campaigns.map((campaign) => (
                <Button
                  key={campaign.id}
                  variant={selectedCampaigns.includes(campaign.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (selectedCampaigns.includes(campaign.id)) {
                      setSelectedCampaigns(prev => prev.filter(id => id !== campaign.id))
                    } else {
                      setSelectedCampaigns(prev => [...prev, campaign.id])
                    }
                  }}
                >
                  {campaign.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {aggregatedData.impressions.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              Across selected period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aggregatedData.clicks.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              CTR: {avgCtr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${aggregatedData.cost.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              Avg CPC: ${avgCpc.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {aggregatedData.conversions}
            </div>
            <p className="text-xs text-gray-500">
              Rate: {conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Breakdown</CardTitle>
          <CardDescription>
            Detailed performance metrics by campaign for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading performance data...</div>
            </div>
          ) : Object.keys(campaignPerformance).length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">No performance data available for the selected period</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Campaign</th>
                    <th className="text-right py-3 px-2 font-medium">Impressions</th>
                    <th className="text-right py-3 px-2 font-medium">Clicks</th>
                    <th className="text-right py-3 px-2 font-medium">CTR</th>
                    <th className="text-right py-3 px-2 font-medium">Cost</th>
                    <th className="text-right py-3 px-2 font-medium">CPC</th>
                    <th className="text-right py-3 px-2 font-medium">Conversions</th>
                    <th className="text-right py-3 px-2 font-medium">Conv. Rate</th>
                    <th className="text-right py-3 px-2 font-medium">Cost/Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(campaignPerformance).map(([campaignId, data]: [string, any]) => {
                    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
                    const cpc = data.clicks > 0 ? data.cost / data.clicks : 0
                    const convRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
                    const costPerConv = data.conversions > 0 ? data.cost / data.conversions : 0

                    return (
                      <tr key={campaignId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="font-medium">{data.campaignName}</div>
                          <div className="text-sm text-gray-500">ID: {campaignId}</div>
                        </td>
                        <td className="text-right py-3 px-2">{data.impressions.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">{data.clicks.toLocaleString()}</td>
                        <td className="text-right py-3 px-2">
                          <div className="flex items-center justify-end">
                            {ctr.toFixed(2)}%
                            {ctr > 3 ? (
                              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                            ) : ctr < 1 ? (
                              <TrendingDown className="h-3 w-3 text-red-500 ml-1" />
                            ) : null}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">${data.cost.toFixed(2)}</td>
                        <td className="text-right py-3 px-2">${cpc.toFixed(2)}</td>
                        <td className="text-right py-3 px-2">{data.conversions}</td>
                        <td className="text-right py-3 px-2">
                          <div className="flex items-center justify-end">
                            {convRate.toFixed(2)}%
                            {convRate > 5 ? (
                              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
                            ) : convRate < 2 ? (
                              <TrendingDown className="h-3 w-3 text-red-500 ml-1" />
                            ) : null}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">${costPerConv.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-blue-800">Top Performing Campaign</h4>
              {Object.keys(campaignPerformance).length > 0 ? (
                <div className="text-sm">
                  {Object.entries(campaignPerformance)
                    .sort(([,a], [,b]) => (b as any).conversions - (a as any).conversions)[0]?.[1]?.campaignName || 'N/A'}
                  <Badge variant="secondary" className="ml-2">Best Conversions</Badge>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No data available</div>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-800">Optimization Opportunity</h4>
              <div className="text-sm">
                {avgCtr < 2 ? (
                  <>Low CTR detected. Consider improving ad copy and targeting.</>
                ) : conversionRate < 3 ? (
                  <>Conversion rate could be improved. Review landing pages.</>
                ) : (
                  <>Performance looks good! Monitor for continued optimization.</>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}