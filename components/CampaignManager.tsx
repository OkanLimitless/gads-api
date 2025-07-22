'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit2, Play, Pause } from 'lucide-react'
import type { Campaign } from '@/lib/google-ads'

interface CampaignManagerProps {
  campaigns: Campaign[]
  onCampaignsChange: (campaigns: Campaign[]) => void
  loading: boolean
  customerId?: string
  refreshToken?: string
}

export default function CampaignManager({ campaigns, onCampaignsChange, loading, customerId, refreshToken }: CampaignManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    biddingStrategy: 'MAXIMIZE_CLICKS',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId || '123-456-7890',
          refreshToken,
          ...formData,
          budget: parseFloat(formData.budget)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onCampaignsChange([...campaigns, data.campaign])
        setFormData({
          name: '',
          budget: '',
          biddingStrategy: 'MAXIMIZE_CLICKS',
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENABLED':
        return 'bg-green-500'
      case 'PAUSED':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading campaigns...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Campaigns</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Set up a new advertising campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaign Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Daily Budget ($)</label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bidding Strategy</label>
                  <select
                    value={formData.biddingStrategy}
                    onChange={(e) => setFormData({ ...formData, biddingStrategy: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="MAXIMIZE_CLICKS">Maximize Clicks</option>
                    <option value="TARGET_CPA">Target CPA</option>
                    <option value="TARGET_ROAS">Target ROAS</option>
                    <option value="MANUAL_CPC">Manual CPC</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Campaign</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Budget: ${campaign.budget}/day • Strategy: {campaign.biddingStrategy.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Start: {campaign.startDate} {campaign.endDate && `• End: ${campaign.endDate}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    {campaign.status === 'ENABLED' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}