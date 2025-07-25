import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Target, DollarSign, Calendar, Settings } from 'lucide-react'

interface CampaignCreationFormProps {
  selectedAccount: {
    id: string
    name: string
    currency: string
    timeZone: string
    status: string
  }
  onSuccess?: (campaignData: any) => void
  onError?: (error: string) => void
}

interface CampaignFormData {
  name: string
  budgetAmount: number
  biddingStrategy: 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MANUAL_CPC'
  targetCpa?: number
  targetRoas?: number
  campaignType: 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'VIDEO'
  startDate: string
  endDate?: string
  adGroupName?: string
  keywords?: string
}

export default function CampaignCreationForm({ selectedAccount, onSuccess, onError }: CampaignCreationFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    budgetAmount: 10,
    biddingStrategy: 'MANUAL_CPC',
    campaignType: 'SEARCH',
    startDate: new Date().toISOString().split('T')[0],
    adGroupName: '',
    keywords: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Prepare campaign data for API
      const campaignData = {
        name: formData.name,
        budgetAmountMicros: formData.budgetAmount * 1000000, // Convert to micros
        biddingStrategy: formData.biddingStrategy,
        campaignType: formData.campaignType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        adGroupName: formData.adGroupName || undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
        ...(formData.biddingStrategy === 'TARGET_CPA' && formData.targetCpa && {
          targetCpa: formData.targetCpa * 1000000 // Convert to micros
        }),
        ...(formData.biddingStrategy === 'TARGET_ROAS' && formData.targetRoas && {
          targetRoas: formData.targetRoas
        })
      }

      console.log('🚀 Creating campaign with data:', campaignData)

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedAccount.id,
          campaignData
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(`Campaign "${formData.name}" created successfully! Campaign ID: ${result.campaignId}`)
        onSuccess?.(result)
        
        // Reset form
        setFormData({
          name: '',
          budgetAmount: 10,
          biddingStrategy: 'MANUAL_CPC',
          campaignType: 'SEARCH',
          startDate: new Date().toISOString().split('T')[0],
          adGroupName: '',
          keywords: ''
        })
      } else {
        const errorMsg = result.error || 'Failed to create campaign'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      const errorMsg = 'Failed to create campaign'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Create New Campaign
        </CardTitle>
        <CardDescription>
          Create a new Google Ads campaign for: <strong>{selectedAccount.name}</strong>
          <span className="block mt-1 text-sm text-gray-500">
            Account ID: {selectedAccount.id} | Currency: {selectedAccount.currency}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Campaign Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-4 w-4 text-gray-600" />
              <h3 className="text-lg font-medium">Campaign Details</h3>
            </div>
            
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter campaign name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select value={formData.campaignType} onValueChange={(value) => handleInputChange('campaignType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEARCH">Search</SelectItem>
                    <SelectItem value="DISPLAY">Display</SelectItem>
                    <SelectItem value="SHOPPING">Shopping</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budgetAmount">Daily Budget ({selectedAccount.currency}) *</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.budgetAmount}
                  onChange={(e) => handleInputChange('budgetAmount', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Bidding Strategy */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <h3 className="text-lg font-medium">Bidding Strategy</h3>
            </div>
            
            <div>
              <Label htmlFor="biddingStrategy">Bidding Strategy</Label>
              <Select value={formData.biddingStrategy} onValueChange={(value) => handleInputChange('biddingStrategy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL_CPC">Manual CPC</SelectItem>
                  <SelectItem value="TARGET_CPA">Target CPA</SelectItem>
                  <SelectItem value="TARGET_ROAS">Target ROAS</SelectItem>
                  <SelectItem value="MAXIMIZE_CONVERSIONS">Maximize Conversions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.biddingStrategy === 'TARGET_CPA' && (
              <div>
                <Label htmlFor="targetCpa">Target CPA ({selectedAccount.currency})</Label>
                <Input
                  id="targetCpa"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.targetCpa || ''}
                  onChange={(e) => handleInputChange('targetCpa', parseFloat(e.target.value))}
                  placeholder="Enter target cost per acquisition"
                />
              </div>
            )}

            {formData.biddingStrategy === 'TARGET_ROAS' && (
              <div>
                <Label htmlFor="targetRoas">Target ROAS</Label>
                <Input
                  id="targetRoas"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.targetRoas || ''}
                  onChange={(e) => handleInputChange('targetRoas', parseFloat(e.target.value))}
                  placeholder="Enter target return on ad spend (e.g., 4.0 for 400%)"
                />
              </div>
            )}
          </div>

          {/* Campaign Schedule */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-4 w-4 text-gray-600" />
              <h3 className="text-lg font-medium">Campaign Schedule</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Ad Group and Keywords (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-4 w-4 text-gray-600" />
              <h3 className="text-lg font-medium">Ad Group & Keywords (Optional)</h3>
            </div>
            
            <div>
              <Label htmlFor="adGroupName">Default Ad Group Name</Label>
              <Input
                id="adGroupName"
                value={formData.adGroupName}
                onChange={(e) => handleInputChange('adGroupName', e.target.value)}
                placeholder="Enter ad group name (optional)"
              />
            </div>

            <div>
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Textarea
                id="keywords"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="Enter keywords separated by commas (optional)"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Example: digital marketing, online advertising, ppc management
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}