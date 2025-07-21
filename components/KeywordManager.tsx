'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit2, DollarSign, Hash } from 'lucide-react'
import type { Keyword, AdGroup } from '@/lib/google-ads'

interface KeywordManagerProps {
  keywords: Keyword[]
  adGroups: AdGroup[]
  onKeywordsChange: (keywords: Keyword[]) => void
  loading: boolean
}

export default function KeywordManager({ keywords, adGroups, onKeywordsChange, loading }: KeywordManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    text: '',
    matchType: 'BROAD',
    adGroupId: '',
    maxCpc: ''
  })

  const handleCreateKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/keywords', {
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
        onKeywordsChange([...keywords, data.keyword])
        setFormData({
          text: '',
          matchType: 'BROAD',
          adGroupId: '',
          maxCpc: ''
        })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating keyword:', error)
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

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'EXACT':
        return 'bg-blue-500'
      case 'PHRASE':
        return 'bg-purple-500'
      case 'BROAD':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getAdGroupName = (adGroupId: string) => {
    const adGroup = adGroups.find(ag => ag.id === adGroupId)
    return adGroup?.name || 'Unknown Ad Group'
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading keywords...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Keywords</h3>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Keyword
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Keyword</CardTitle>
            <CardDescription>Add keywords to target specific search terms in your ad groups</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKeyword} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Keyword Text</label>
                  <Input
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    placeholder="wireless headphones"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Match Type</label>
                  <select
                    value={formData.matchType}
                    onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="BROAD">Broad Match</option>
                    <option value="PHRASE">Phrase Match</option>
                    <option value="EXACT">Exact Match</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ad Group</label>
                  <select
                    value={formData.adGroupId}
                    onChange={(e) => setFormData({ ...formData, adGroupId: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select an ad group</option>
                    {adGroups.map((adGroup) => (
                      <option key={adGroup.id} value={adGroup.id}>
                        {adGroup.name}
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
                <Button type="submit">Add Keyword</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {keywords.map((keyword) => (
          <Card key={keyword.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{keyword.text}</h3>
                    <Badge className={getStatusColor(keyword.status)}>
                      {keyword.status}
                    </Badge>
                    <Badge className={getMatchTypeColor(keyword.matchType)}>
                      {keyword.matchType}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Ad Group: {getAdGroupName(keyword.adGroupId)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Max CPC: ${keyword.maxCpc.toFixed(2)}
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
        
        {keywords.length === 0 && !loading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No keywords found. Add your first keyword to start targeting search terms.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}