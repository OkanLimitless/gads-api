import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Target, DollarSign, Calendar, Settings, Globe, Edit, Plus, Trash2 } from 'lucide-react'

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
  onBack?: () => void
}

interface CampaignData {
  // Campaign Settings
  name: string
  budget: number
  biddingStrategy: string
  campaignType: string
  startDate: string
  endDate?: string
  
  // Ad Group Settings
  adGroupName: string
  defaultBid: number
  
  // Responsive Search Ad
  finalUrl: string
  finalMobileUrl?: string
  path1?: string
  path2?: string
  headlines: string[]
  descriptions: string[]
  
  // Keywords
  keywords: string[]
  
  // Location Targeting
  locations: string[]
  
  // Other Settings
  languageCode: string
  networkSettings: {
    targetGoogleSearch: boolean
    targetSearchNetwork: boolean
    targetContentNetwork: boolean
  }
}

const STEP_TITLES = [
  'Campaign Basics',
  'Budget & Bidding', 
  'Targeting',
  'Ad Creation',
  'Keywords',
  'Review & Create'
]

export default function CampaignCreationForm({ selectedAccount, onSuccess, onError, onBack }: CampaignCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    budget: 1000,
    biddingStrategy: 'MAXIMIZE_CONVERSIONS',
    campaignType: 'SEARCH',
    startDate: new Date().toISOString().split('T')[0],
    adGroupName: '',
    defaultBid: 100,
    finalUrl: '',
    headlines: ['', '', ''],
    descriptions: ['', ''],
    keywords: [''],
    locations: ['US'],
    languageCode: 'en',
    networkSettings: {
      targetGoogleSearch: true,
      targetSearchNetwork: true,
      targetContentNetwork: false
    }
  })

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 0: // Campaign Basics
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required'
        if (!campaignData.adGroupName.trim()) newErrors.adGroupName = 'Ad group name is required'
        break
      
      case 1: // Budget & Bidding
        if (campaignData.budget < 100) newErrors.budget = 'Minimum budget is $1.00'
        if (campaignData.defaultBid < 10) newErrors.defaultBid = 'Minimum bid is $0.10'
        break
      
      case 2: // Targeting
        if (campaignData.locations.length === 0) newErrors.locations = 'At least one location is required'
        break
      
      case 3: // Ad Creation
        if (!campaignData.finalUrl.trim()) newErrors.finalUrl = 'Final URL is required'
        if (!campaignData.finalUrl.startsWith('http')) newErrors.finalUrl = 'Final URL must start with http:// or https://'
        
        const validHeadlines = campaignData.headlines.filter(h => h.trim().length > 0)
        if (validHeadlines.length < 3) newErrors.headlines = 'At least 3 headlines are required'
        
        const validDescriptions = campaignData.descriptions.filter(d => d.trim().length > 0)
        if (validDescriptions.length < 2) newErrors.descriptions = 'At least 2 descriptions are required'
        break
      
      case 4: // Keywords
        const validKeywords = campaignData.keywords.filter(k => k.trim().length > 0)
        if (validKeywords.length === 0) newErrors.keywords = 'At least one keyword is required'
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEP_TITLES.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const updateCampaignData = (field: string, value: any) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addArrayItem = (field: 'headlines' | 'descriptions' | 'keywords') => {
    setCampaignData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const updateArrayItem = (field: 'headlines' | 'descriptions' | 'keywords', index: number, value: string) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (field: 'headlines' | 'descriptions' | 'keywords', index: number) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/campaigns/${selectedAccount.id}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignData: {
            name: campaignData.name,
            budgetAmountMicros: campaignData.budget * 10000, // Convert to micros
            biddingStrategy: campaignData.biddingStrategy,
            campaignType: campaignData.campaignType,
            startDate: campaignData.startDate,
            endDate: campaignData.endDate,
            adGroupName: campaignData.adGroupName,
            defaultBidMicros: campaignData.defaultBid * 10000, // Convert to micros
            finalUrl: campaignData.finalUrl,
            finalMobileUrl: campaignData.finalMobileUrl,
            path1: campaignData.path1,
            path2: campaignData.path2,
            headlines: campaignData.headlines.filter(h => h.trim().length > 0),
            descriptions: campaignData.descriptions.filter(d => d.trim().length > 0),
            keywords: campaignData.keywords.filter(k => k.trim().length > 0),
            locations: campaignData.locations,
            languageCode: campaignData.languageCode,
            networkSettings: campaignData.networkSettings
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.error || 'Failed to create campaign')
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Campaign Basics
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input
                id="campaignName"
                value={campaignData.name}
                onChange={(e) => updateCampaignData('name', e.target.value)}
                placeholder="e.g., Search Campaign - Q1 2024"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="adGroupName">Ad Group Name *</Label>
              <Input
                id="adGroupName"
                value={campaignData.adGroupName}
                onChange={(e) => updateCampaignData('adGroupName', e.target.value)}
                placeholder="e.g., General Keywords"
                className={errors.adGroupName ? 'border-red-500' : ''}
              />
              {errors.adGroupName && <p className="text-sm text-red-500 mt-1">{errors.adGroupName}</p>}
            </div>

            <div>
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select value={campaignData.campaignType} onValueChange={(value) => updateCampaignData('campaignType', value)}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={campaignData.startDate}
                  onChange={(e) => updateCampaignData('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignData.endDate || ''}
                  onChange={(e) => updateCampaignData('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 1: // Budget & Bidding
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="budget">Daily Budget (cents) *</Label>
              <Input
                id="budget"
                type="number"
                min="100"
                step="100"
                value={campaignData.budget}
                onChange={(e) => updateCampaignData('budget', parseInt(e.target.value) || 0)}
                className={errors.budget ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">Amount in cents (e.g., 1000 = $10.00)</p>
              {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
            </div>

            <div>
              <Label htmlFor="biddingStrategy">Bidding Strategy</Label>
              <Select value={campaignData.biddingStrategy} onValueChange={(value) => updateCampaignData('biddingStrategy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAXIMIZE_CONVERSIONS">Maximize Conversions</SelectItem>
                  <SelectItem value="MAXIMIZE_CONVERSION_VALUE">Maximize Conversion Value</SelectItem>
                  <SelectItem value="TARGET_CPA">Target CPA</SelectItem>
                  <SelectItem value="TARGET_ROAS">Target ROAS</SelectItem>
                  <SelectItem value="MANUAL_CPC">Manual CPC</SelectItem>
                  <SelectItem value="ENHANCED_CPC">Enhanced CPC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultBid">Default Bid (cents) *</Label>
              <Input
                id="defaultBid"
                type="number"
                min="10"
                step="10"
                value={campaignData.defaultBid}
                onChange={(e) => updateCampaignData('defaultBid', parseInt(e.target.value) || 0)}
                className={errors.defaultBid ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">Amount in cents (e.g., 100 = $1.00)</p>
              {errors.defaultBid && <p className="text-sm text-red-500 mt-1">{errors.defaultBid}</p>}
            </div>
          </div>
        )

      case 2: // Targeting
        return (
          <div className="space-y-6">
            <div>
              <Label>Location Targeting *</Label>
              <Select value={campaignData.locations[0]} onValueChange={(value) => updateCampaignData('locations', [value])}>
                <SelectTrigger className={errors.locations ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
              {errors.locations && <p className="text-sm text-red-500 mt-1">{errors.locations}</p>}
            </div>

            <div>
              <Label>Language</Label>
              <Select value={campaignData.languageCode} onValueChange={(value) => updateCampaignData('languageCode', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Network Settings</Label>
              <div className="space-y-3 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={campaignData.networkSettings.targetGoogleSearch}
                    onChange={(e) => updateCampaignData('networkSettings', {
                      ...campaignData.networkSettings,
                      targetGoogleSearch: e.target.checked
                    })}
                  />
                  <span>Google Search</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={campaignData.networkSettings.targetSearchNetwork}
                    onChange={(e) => updateCampaignData('networkSettings', {
                      ...campaignData.networkSettings,
                      targetSearchNetwork: e.target.checked
                    })}
                  />
                  <span>Search Partners</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={campaignData.networkSettings.targetContentNetwork}
                    onChange={(e) => updateCampaignData('networkSettings', {
                      ...campaignData.networkSettings,
                      targetContentNetwork: e.target.checked
                    })}
                  />
                  <span>Display Network</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 3: // Ad Creation
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="finalUrl">Final URL *</Label>
              <Input
                id="finalUrl"
                value={campaignData.finalUrl}
                onChange={(e) => updateCampaignData('finalUrl', e.target.value)}
                placeholder="https://example.com/landing-page"
                className={errors.finalUrl ? 'border-red-500' : ''}
              />
              {errors.finalUrl && <p className="text-sm text-red-500 mt-1">{errors.finalUrl}</p>}
            </div>

            <div>
              <Label htmlFor="finalMobileUrl">Mobile Final URL (Optional)</Label>
              <Input
                id="finalMobileUrl"
                value={campaignData.finalMobileUrl || ''}
                onChange={(e) => updateCampaignData('finalMobileUrl', e.target.value)}
                placeholder="https://m.example.com/landing-page"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="path1">Path 1 (Optional)</Label>
                <Input
                  id="path1"
                  value={campaignData.path1 || ''}
                  onChange={(e) => updateCampaignData('path1', e.target.value)}
                  placeholder="products"
                />
              </div>
              <div>
                <Label htmlFor="path2">Path 2 (Optional)</Label>
                <Input
                  id="path2"
                  value={campaignData.path2 || ''}
                  onChange={(e) => updateCampaignData('path2', e.target.value)}
                  placeholder="shoes"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Headlines * (Minimum 3, Maximum 15)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('headlines')}
                  disabled={campaignData.headlines.length >= 15}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {campaignData.headlines.map((headline, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={headline}
                      onChange={(e) => updateArrayItem('headlines', index, e.target.value)}
                      placeholder={`Headline ${index + 1} (max 30 characters)`}
                      maxLength={30}
                    />
                    {campaignData.headlines.length > 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('headlines', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.headlines && <p className="text-sm text-red-500 mt-1">{errors.headlines}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Descriptions * (Minimum 2, Maximum 4)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('descriptions')}
                  disabled={campaignData.descriptions.length >= 4}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {campaignData.descriptions.map((description, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={description}
                      onChange={(e) => updateArrayItem('descriptions', index, e.target.value)}
                      placeholder={`Description ${index + 1} (max 90 characters)`}
                      maxLength={90}
                      rows={2}
                    />
                    {campaignData.descriptions.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('descriptions', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.descriptions && <p className="text-sm text-red-500 mt-1">{errors.descriptions}</p>}
            </div>
          </div>
        )

      case 4: // Keywords
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Keywords *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('keywords')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {campaignData.keywords.map((keyword, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={keyword}
                      onChange={(e) => updateArrayItem('keywords', index, e.target.value)}
                      placeholder={`Keyword ${index + 1}`}
                    />
                    {campaignData.keywords.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('keywords', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.keywords && <p className="text-sm text-red-500 mt-1">{errors.keywords}</p>}
              <p className="text-sm text-gray-500 mt-2">
                Enter keywords that are relevant to your business. You can use match types like "exact match", [broad match], and +modified +broad +match.
              </p>
            </div>
          </div>
        )

      case 5: // Review & Create
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Campaign</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Campaign Name</Label>
                    <p>{campaignData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ad Group Name</Label>
                    <p>{campaignData.adGroupName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Daily Budget</Label>
                    <p>${(campaignData.budget / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Bidding Strategy</Label>
                    <p>{campaignData.biddingStrategy.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Final URL</Label>
                  <p className="break-all">{campaignData.finalUrl}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Headlines</Label>
                  <ul className="list-disc list-inside">
                    {campaignData.headlines.filter(h => h.trim()).map((headline, index) => (
                      <li key={index}>{headline}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Descriptions</Label>
                  <ul className="list-disc list-inside">
                    {campaignData.descriptions.filter(d => d.trim()).map((description, index) => (
                      <li key={index}>{description}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Keywords</Label>
                  <p>{campaignData.keywords.filter(k => k.trim()).join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Create Campaign - {STEP_TITLES[currentStep]}
            </CardTitle>
            <CardDescription>
              Creating campaign for: <strong>{selectedAccount.name}</strong>
              <span className="block mt-1 text-sm text-gray-500">
                Account ID: {selectedAccount.id}
              </span>
            </CardDescription>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mt-4">
          {STEP_TITLES.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep ? 'bg-green-500 text-white' :
                index === currentStep ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEP_TITLES.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}