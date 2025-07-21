'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart3, PlusCircle, Settings, Target, TrendingUp, Users } from 'lucide-react'
import CampaignManager from '@/components/CampaignManager'
import AdGroupManager from '@/components/AdGroupManager'
import KeywordManager from '@/components/KeywordManager'
import type { Campaign, AdGroup, Keyword } from '@/lib/google-ads'

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adGroups, setAdGroups] = useState<AdGroup[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

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

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'ENABLED').length
  const totalKeywords = keywords.length

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AdGenius Creator</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keywords</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeywords}</div>
            <p className="text-xs text-muted-foreground">
              Active targeting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="adgroups">Ad Groups</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Create and manage your Google Ads campaigns
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
              <CardTitle>Ad Group Management</CardTitle>
              <CardDescription>
                Organize your ads into targeted groups
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
              <CardTitle>Keyword Management</CardTitle>
              <CardDescription>
                Manage keywords for your ad groups
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
  )
}