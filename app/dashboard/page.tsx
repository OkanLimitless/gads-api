'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BarChart3, Settings, Target, TrendingUp, Users, ArrowLeft, Link2, AlertCircle, CheckCircle, Loader2, LogOut, Building2 } from 'lucide-react'
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

const PerformanceReports = dynamic(() => import('@/components/PerformanceReports'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading performance data...</div>
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

interface AdAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  canManageCampaigns: boolean
  testAccount: boolean
  isManager: boolean
  managerCustomerId?: string
  level: number
  accountType: 'MCC' | 'CLIENT' | 'UNKNOWN'
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adGroups, setAdGroups] = useState<AdGroup[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [apiSource, setApiSource] = useState<'mock_data' | 'google_ads_api'>('mock_data')
  const [accountsStats, setAccountsStats] = useState<{
    totalAccounts: number
    managerAccounts: number
    clientAccounts: number
  }>({ totalAccounts: 0, managerAccounts: 0, clientAccounts: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === 'authenticated' && session) {
      fetchAccounts()
    } else if (mounted && status === 'unauthenticated') {
      // Load mock data for demo
      fetchData()
    }
  }, [mounted, status, session])

  useEffect(() => {
    if (selectedAccount) {
      fetchData()
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    setAccountsLoading(true)
    try {
      const response = await fetch('/api/accounts')
      const data = await response.json()
      
      if (response.ok && data.accounts) {
        setAccounts(data.accounts)
        setAccountsStats({
          totalAccounts: data.totalAccounts || data.accounts.length,
          managerAccounts: data.managerAccounts || 0,
          clientAccounts: data.clientAccounts || 0
        })
        
        // Auto-select first account that can manage campaigns
        const firstManageableAccount = data.accounts.find((acc: AdAccount) => acc.canManageCampaigns)
        if (firstManageableAccount) {
          setSelectedAccount(firstManageableAccount.id)
        }
      } else if (response.status === 401) {
        console.log('Authentication required for real API, using mock data')
        fetchData()
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      fetchData() // Fall back to mock data
    } finally {
      setAccountsLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedAccount) params.set('customerId', selectedAccount)

      const [campaignsRes, adGroupsRes, keywordsRes] = await Promise.all([
        fetch(`/api/campaigns?${params.toString()}`),
        fetch(`/api/ad-groups?${params.toString()}`),
        fetch(`/api/keywords?${params.toString()}`)
      ])

      const campaignsData = await campaignsRes.json()
      const adGroupsData = await adGroupsRes.json()
      const keywordsData = await keywordsRes.json()

      setCampaigns(campaignsData.campaigns || [])
      setAdGroups(adGroupsData.adGroups || [])
      setKeywords(keywordsData.keywords || [])
      
      // Set API source based on response
      if (campaignsData.source) {
        setApiSource(campaignsData.source)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    signIn('google')
  }

  const handleSignOut = () => {
    signOut()
    setAccounts([])
    setSelectedAccount('')
    setAccountsStats({ totalAccounts: 0, managerAccounts: 0, clientAccounts: 0 })
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
  const isAuthenticated = status === 'authenticated'

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
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Connected as {session?.user?.name}</span>
                  </div>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={handleSignIn} variant="outline" size="sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Google Ads
                </Button>
              )}
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
              <div className="text-sm text-gray-500">
                Data Source: {apiSource === 'google_ads_api' ? 'Google Ads API' : 'Demo Mode'}
              </div>
              {isAuthenticated ? (
                <div className="text-sm font-medium text-green-600">Real API Connected</div>
              ) : (
                <div className="text-sm font-medium text-blue-600">Using Demo Data</div>
              )}
            </div>
          </div>

          {/* Account Selection */}
          {isAuthenticated && accounts.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900">
                  <Target className="h-5 w-5 mr-2" />
                  Select Google Ads Account
                  <div className="ml-auto flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      <span>{accountsStats.totalAccounts} Total</span>
                    </div>
                    <div className="text-blue-700">
                      {accountsStats.managerAccounts} MCC • {accountsStats.clientAccounts} Client
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {accountsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading accounts...</span>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAccount === account.id
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                          onClick={() => account.canManageCampaigns ? setSelectedAccount(account.id) : null}
                          style={{ cursor: account.canManageCampaigns ? 'pointer' : 'not-allowed' }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{account.name}</div>
                            <div className="flex items-center space-x-1">
                              {account.isManager && (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">MCC</span>
                              )}
                              {account.testAccount && (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">Test</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            ID: {account.id} • {account.currency}
                          </div>
                          {!account.canManageCampaigns && (
                            <div className="text-xs text-gray-400 mt-1">
                              Manager account - cannot manage campaigns directly
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
              <TabsTrigger value="performance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Performance
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
                    customerId={selectedAccount}
                    refreshToken={session?.refreshToken || ''}
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

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Reports
                  </CardTitle>
                  <CardDescription>
                    Analyze campaign performance with detailed metrics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceReports 
                    customerId={selectedAccount}
                    refreshToken={session?.refreshToken || ''}
                    campaigns={campaigns}
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