'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit2, DollarSign } from 'lucide-react'
import type { AdGroup, Campaign } from '@/lib/google-ads'

interface AdGroupManagerProps {
  adGroups: AdGroup[]
  campaigns: Campaign[]
  onAdGroupsChange: (adGroups: AdGroup[]) => void
  loading: boolean
}

export default function AdGroupManager({ adGroups, campaigns, onAdGroupsChange, loading }: AdGroupManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    campaignId: '',
    maxCpc: ''
  })

  const handleCreateAdGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/ad-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: '123-456-7890',
          ...formData,
          maxCpc: parseFloat(formData.maxCpc)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onAdGroupsChange([...adGroups, data.adGroup])
        setFormData({
          name: '',
          campaignId: '',
          maxCpc: ''
        })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating ad group:', error)
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

  const getCampaignName = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign?.name || 'Unknown Campaign'
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading ad groups...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Ad Groups</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Ad Group
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Ad Group</CardTitle>
            <CardDescription>Organize your ads into targeted groups within a campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Ad Group Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter ad group name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Campaign</label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max CPC ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.maxCpc}
                    onChange={(e) => setFormData({ ...formData, maxCpc: e.target.value })}
                    placeholder="2.50"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Ad Group</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {adGroups.map((adGroup) => (
          <Card key={adGroup.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{adGroup.name}</h3>
                    <Badge className={getStatusColor(adGroup.status)}>
                      {adGroup.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Campaign: {getCampaignName(adGroup.campaignId)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Max CPC: ${adGroup.maxCpc.toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {adGroups.length === 0 && !loading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No ad groups found. Create your first ad group to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}