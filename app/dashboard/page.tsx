'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BarChart3, Settings, Target, TrendingUp, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Import components dynamically to avoid SSR issues
import dynamic from 'next/dynamic'

const CampaignManager = dynamic(() => import('@/components/CampaignManager'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading campaigns...</div>
})

const AdGroupManager = dynamic(() => import('@/components/AdGroupManager'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading ad groups...</div>
})

const KeywordManager = dynamic(() => import('@/components/KeywordManager'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading keywords...</div>
})

interface Campaign {
  id: string
  name: string
  status: string
  budget: number
  biddingStrategy: string
  startDate: string
  endDate?: string
}

interface AdGroup {
  id: string
  name: string
  campaignId: string
  status: string
  maxCpc: number
}

interface Keyword {
  id: string
  text: string
  matchType: string
  adGroupId: string
  status: string
  maxCpc: number
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adGroups, setAdGroups] = useState<AdGroup[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchData()
    }
  }, [mounted])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [campaignsRes, adGroupsRes, keywordsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/ad-groups'),
        fetch('/api/keywords')
      ])

      const campaignsData = await campaignsRes.json()
      const adGroupsData = await adGroupsRes.json()
      const keywordsData = await keywordsRes.json()

      setCampaigns(campaignsData.campaigns || [])
      setAdGroups(adGroupsData.adGroups || [])
      setKeywords(keywordsData.keywords || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading AdGenius Pro Dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'ENABLED').length
  const totalKeywords = keywords.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AdGenius Pro
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Campaign Dashboard</h2>
              <p className="text-gray-600 mt-1">Manage your Google Ads campaigns, ad groups, and keywords</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Demo Account</div>
              <div className="text-sm font-medium text-blue-600">Using Test API Token</div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</div>
                <p className="text-xs text-gray-500">
                  Daily budget across all campaigns
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeCampaigns}</div>
                <p className="text-xs text-gray-500">
                  {campaigns.length} total campaigns
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ad Groups</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{adGroups.length}</div>
                <p className="text-xs text-gray-500">
                  Organized targeting groups
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalKeywords}</div>
                <p className="text-xs text-gray-500">
                  Active targeting keywords
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <BarChart3 className="h-5 w-5 mr-2" />
                AI Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+23%</div>
                  <div className="text-sm text-gray-600">CTR Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">-15%</div>
                  <div className="text-sm text-gray-600">CPC Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">+45%</div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList className="bg-white border">
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="adgroups" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Ad Groups
              </TabsTrigger>
              <TabsTrigger value="keywords" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Keywords
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Campaign Management
                  </CardTitle>
                  <CardDescription>
                    Create, optimize, and manage your Google Ads campaigns with AI-powered automation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CampaignManager 
                    campaigns={campaigns} 
                    onCampaignsChange={setCampaigns}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="adgroups">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    Ad Group Management
                  </CardTitle>
                  <CardDescription>
                    Organize your ads into targeted groups for better performance and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdGroupManager 
                    adGroups={adGroups}
                    campaigns={campaigns}
                    onAdGroupsChange={setAdGroups}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                    Keyword Management
                  </CardTitle>
                  <CardDescription>
                    Research, add, and optimize keywords with intelligent match type suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeywordManager 
                    keywords={keywords}
                    adGroups={adGroups}
                    onKeywordsChange={setKeywords}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}