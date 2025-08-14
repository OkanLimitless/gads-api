import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Target, DollarSign, Calendar, Settings, Globe, Edit, Plus, Trash2, Clock } from 'lucide-react'
import TemplateManager from './TemplateManager'
import AdScheduleManager from './AdScheduleManager'
import RealCampaignTemplateManager from './RealCampaignTemplateManager'

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

interface AdScheduleTemplate {
  id: string
  name: string
  description: string
  schedule: {
    dayOfWeek: string // MONDAY, TUESDAY, etc.
    startHour: number // 0-23
    startMinute: number // 0, 15, 30, 45
    endHour: number // 0-23
    endMinute: number // 0, 15, 30, 45
    bidModifier?: number // -90 to 900 (percentage)
  }[]
  createdAt: string
  updatedAt: string
}

interface CampaignData {
  // Campaign Settings
  name: string
  budget: number
  
  // Responsive Search Ad
  finalUrl: string
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
  adScheduleTemplateId?: string
  deviceTargeting: 'ALL' | 'MOBILE_ONLY'
}

interface CampaignTemplate {
  id: string
  name: string
  description: string
  data: Omit<CampaignData, 'name'> // Template doesn't include campaign name
  createdAt: string
  updatedAt: string
}

const STEP_TITLES = [
  'Campaign Setup',
  'Targeting',
  'Ad Creation',
  'Keywords',
  'Review & Create'
]

export default function CampaignCreationForm({ selectedAccount, onSuccess, onError, onBack }: CampaignCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTemplateChoice, setShowTemplateChoice] = useState(true)
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showRealTemplateSelector, setShowRealTemplateSelector] = useState(false)
  const [adScheduleTemplates, setAdScheduleTemplates] = useState<AdScheduleTemplate[]>([])
  const [showAdScheduleManager, setShowAdScheduleManager] = useState(false)
  
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    budget: 10, // Budget in dollars (will be converted to micros in backend)
    finalUrl: '',
    headlines: ['', '', ''],
    descriptions: ['', ''],
    keywords: [''],
    locations: ['US'],
    languageCode: 'en',
    deviceTargeting: 'ALL'
  })

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('campaignTemplates')
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates))
    }
    
    const savedAdScheduleTemplates = localStorage.getItem('adScheduleTemplates')
    if (savedAdScheduleTemplates) {
      setAdScheduleTemplates(JSON.parse(savedAdScheduleTemplates))
    }
  }, [])

  // Save templates to localStorage
  const saveTemplates = (newTemplates: CampaignTemplate[]) => {
    localStorage.setItem('campaignTemplates', JSON.stringify(newTemplates))
    setTemplates(newTemplates)
  }

  // Save ad schedule templates to localStorage
  const saveAdScheduleTemplates = (newTemplates: AdScheduleTemplate[]) => {
    localStorage.setItem('adScheduleTemplates', JSON.stringify(newTemplates))
    setAdScheduleTemplates(newTemplates)
  }

  // Helper function to get location display name
  const getLocationDisplayName = (locationCode: string): string => {
    const locationNames: Record<string, string> = {
      // Countries
      'US': 'United States (All States)',
      'CA': 'Canada',
      'GB': 'United Kingdom', 
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'NL': 'Netherlands',
      
      // Special targeting
      'TERMINIX': 'Terminix Targeting (CA, NV, AZ, TX, FL, NY, IL, WA, CO, GA, OR, MA, NJ, MD, VA)'
    }
    return locationNames[locationCode] || locationCode
  }

  // Load template data into form
  const loadTemplate = (template: CampaignTemplate) => {
    setCampaignData(prev => ({
      ...template.data,
      name: prev.name // Keep the campaign name separate
    }))
    setSelectedTemplate(template)
    setShowTemplateChoice(false)
  }

  // Load real campaign template data into form
  const loadRealTemplate = (template: any) => {
    setCampaignData(prev => ({
      name: prev.name, // Keep the campaign name separate
      budget: template.data.budget,
      finalUrl: template.data.finalUrl,
      path1: template.data.path1 || '',
      path2: template.data.path2 || '',
      headlines: template.data.headlines,
      descriptions: template.data.descriptions,
      keywords: template.data.keywords,
      locations: template.data.locations,
      languageCode: template.data.languageCode,
      adScheduleTemplateId: template.data.adScheduleTemplateId,
      deviceTargeting: template.data.deviceTargeting
    }))
    setShowRealTemplateSelector(false)
    setShowTemplateChoice(false)
  }

  // Save current form data as template
  const saveAsTemplate = (templateName: string, templateDescription: string) => {
    const template: CampaignTemplate = {
      id: Date.now().toString(),
      name: templateName,
      description: templateDescription,
      data: {
        budget: campaignData.budget,
        finalUrl: campaignData.finalUrl,
        path1: campaignData.path1,
        path2: campaignData.path2,
        headlines: campaignData.headlines,
        descriptions: campaignData.descriptions,
        keywords: campaignData.keywords,
        locations: campaignData.locations,
        languageCode: campaignData.languageCode,
        adScheduleTemplateId: campaignData.adScheduleTemplateId,
        deviceTargeting: campaignData.deviceTargeting
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const newTemplates = [...templates, template]
    saveTemplates(newTemplates)
    return template
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 0: // Campaign Setup
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required'
        if (campaignData.budget < 1) newErrors.budget = 'Minimum budget is $1.00'
        break
      
      case 1: // Targeting
        if (campaignData.locations.length === 0) newErrors.locations = 'At least one location is required'
        break
      
      case 2: // Ad Creation
        if (!campaignData.finalUrl.trim()) newErrors.finalUrl = 'Final URL is required'
        if (!campaignData.finalUrl.startsWith('http')) newErrors.finalUrl = 'Final URL must start with http:// or https://'
        
        const validHeadlines = campaignData.headlines.filter(h => h.trim().length > 0)
        if (validHeadlines.length < 3) newErrors.headlines = 'At least 3 headlines are required'
        
        const validDescriptions = campaignData.descriptions.filter(d => d.trim().length > 0)
        if (validDescriptions.length < 2) newErrors.descriptions = 'At least 2 descriptions are required'
        break
      
      case 3: // Keywords
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
      console.log(`🔍 Frontend Debug: Sending languageCode = '${campaignData.languageCode}'`)
      const response = await fetch(`/api/campaigns/${selectedAccount.id}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignData: {
            name: campaignData.name,
            budgetAmountMicros: campaignData.budget * 1000000, // Convert dollars to micros
            biddingStrategy: 'MAXIMIZE_CONVERSIONS', // Hardcoded to MAXIMIZE_CONVERSIONS
            campaignType: 'SEARCH', // Hardcoded to SEARCH
            startDate: new Date().toISOString().split('T')[0].replace(/-/g, ''), // Today's date in YYYYMMDD format
            adGroupName: 'Ad group1', // Hardcoded ad group name
            defaultBidMicros: 1000000, // Default $1 bid (not used with MAXIMIZE_CONVERSIONS)
            finalUrl: campaignData.finalUrl,
            path1: campaignData.path1,
            path2: campaignData.path2,
            headlines: campaignData.headlines.filter(h => h.trim().length > 0),
            descriptions: campaignData.descriptions.filter(d => d.trim().length > 0),
            keywords: campaignData.keywords.filter(k => k.trim().length > 0),
            locations: campaignData.locations,
            languageCode: campaignData.languageCode,
            deviceTargeting: campaignData.deviceTargeting,
            adScheduleTemplateId: campaignData.adScheduleTemplateId,
            adScheduleTemplate: campaignData.adScheduleTemplateId 
              ? adScheduleTemplates.find(t => t.id === campaignData.adScheduleTemplateId) 
              : undefined,
            networkSettings: {
              targetGoogleSearch: true,
              targetSearchNetwork: false,
              targetContentNetwork: false
            }
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setIsSuccess(true)
        setSuccessData(result)
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

  // Success screen
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Campaign Created Successfully!</CardTitle>
            <CardDescription>
              Your campaign "{campaignData.name}" has been created and is ready to go.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Campaign ID:</span>
                <span className="font-mono text-sm">{successData?.campaignId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Budget ID:</span>
                <span className="font-mono text-sm">{successData?.budgetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ad Group ID:</span>
                <span className="font-mono text-sm">{successData?.adGroupId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Ad ID:</span>
                <span className="font-mono text-sm">{successData?.adId}</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Your campaign is now live and will start showing ads based on your settings.
              </p>
              <Button onClick={onBack} className="w-full">
                Create Another Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Template manager screen
  if (showTemplateManager) {
    return (
      <TemplateManager
        templates={templates}
        onSaveTemplates={saveTemplates}
        onLoadTemplate={(template) => {
          loadTemplate(template)
          setShowTemplateManager(false)
        }}
        onClose={() => setShowTemplateManager(false)}
      />
    )
  }

  // Real campaign template selector screen
  if (showRealTemplateSelector) {
    return (
      <RealCampaignTemplateManager
        mode="selector"
        onSelectTemplate={loadRealTemplate}
        onBack={() => setShowRealTemplateSelector(false)}
      />
    )
  }

  // Ad schedule manager screen
  if (showAdScheduleManager) {
    return (
      <AdScheduleManager
        templates={adScheduleTemplates}
        onSaveTemplates={saveAdScheduleTemplates}
        onClose={() => setShowAdScheduleManager(false)}
      />
    )
  }

  // Template choice screen
  if (showTemplateChoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Target className="h-6 w-6 mr-2 text-blue-600" />
              Create New Campaign
            </CardTitle>
            <CardDescription>
              Choose how you'd like to create your campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Use Template */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-purple-600" />
                    Use Template
                  </CardTitle>
                  <CardDescription>
                    Start with a pre-configured template organized by country (NL/US)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                    <p className="text-gray-600 mb-4">Browse templates by category</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowRealTemplateSelector(true)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Browse Templates (NL/US)
                      </Button>
                      <p className="text-xs text-gray-500">
                        Separate from dummy campaign templates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Create New */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowTemplateChoice(false)}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-green-600" />
                    Create New Campaign
                  </CardTitle>
                  <CardDescription>
                    Start from scratch with a blank campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Build from scratch</p>
                    <p className="text-sm text-gray-600">Full control over all campaign settings</p>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Start Creating
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Campaign Setup
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
              <Label htmlFor="budget">Daily Budget ($) *</Label>
              <Input
                id="budget"
                type="number"
                min="1"
                step="1"
                value={campaignData.budget}
                onChange={(e) => updateCampaignData('budget', parseFloat(e.target.value) || 0)}
                className={errors.budget ? 'border-red-500' : ''}
                placeholder="e.g., 10"
              />
              <p className="text-sm text-gray-500 mt-1">Amount in dollars (e.g., 10 = $10.00 per day)</p>
              {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
            </div>



          </div>
        )

      case 1: // Targeting
        return (
          <div className="space-y-6">
            <div>
              <Label>Location Targeting *</Label>
              <Select value={campaignData.locations[0]} onValueChange={(value) => updateCampaignData('locations', [value])}>
                <SelectTrigger className={errors.locations ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States (All States)</SelectItem>
                  <SelectItem value="TERMINIX">Terminix Targeting (15 States)</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="NL">Netherlands</SelectItem>
                </SelectContent>
              </Select>
              {errors.locations && <p className="text-sm text-red-500 mt-1">{errors.locations}</p>}
            </div>

            <div>
              <Label>Language</Label>
              <Select value={campaignData.languageCode} onValueChange={(value) => setCampaignData(prev => ({ ...prev, languageCode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                  <SelectItem value="sv">Swedish</SelectItem>
                  <SelectItem value="da">Danish</SelectItem>
                  <SelectItem value="no">Norwegian</SelectItem>
                  <SelectItem value="fi">Finnish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Device Targeting</Label>
              <Select value={campaignData.deviceTargeting} onValueChange={(value) => updateCampaignData('deviceTargeting', value as 'ALL' | 'MOBILE_ONLY')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Devices</SelectItem>
                  <SelectItem value="MOBILE_ONLY">Mobile Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Mobile Only will set desktop and tablet bid adjustments to -100%
              </p>
            </div>

            <div>
              <Label>Ad Schedule (Optional)</Label>
              <div className="space-y-3">
                <Select 
                  value={campaignData.adScheduleTemplateId || 'none'} 
                  onValueChange={(value) => {
                    if (value === 'est_business_hours' || value === 'amsterdam_evening_rush' || value === 'energie') {
                      // Handle built-in schedules
                      updateCampaignData('adScheduleTemplateId', value)
                    } else {
                      updateCampaignData('adScheduleTemplateId', value === 'none' ? undefined : value)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Schedule (Show ads all day)</SelectItem>
                    <SelectItem value="est_business_hours">EST Business Hours (9 AM - 9 PM EST)</SelectItem>
                    <SelectItem value="amsterdam_evening_rush">Amsterdam Evening Rush (11 PM - 3 AM AMS)</SelectItem>
                    <SelectItem value="energie">Energie (10 AM - 8:30 PM, Mon-Fri)</SelectItem>
                    {adScheduleTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} (Custom)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Schedule Description */}
                {campaignData.adScheduleTemplateId && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    {campaignData.adScheduleTemplateId === 'est_business_hours' && (
                      <div>
                        <p className="font-medium text-blue-900">EST Business Hours Schedule</p>
                        <p className="text-blue-700">All days: 00:00-03:00 and 15:00-00:00 (UTC)</p>
                        <p className="text-blue-600 text-xs">Converts to 9 AM - 9 PM Eastern Time</p>
                      </div>
                    )}
                    {campaignData.adScheduleTemplateId === 'amsterdam_evening_rush' && (
                      <div>
                        <p className="font-medium text-blue-900">Amsterdam Evening Rush Schedule</p>
                        <p className="text-blue-700">All days: 23:00-00:00 and 00:00-03:00 (UTC)</p>
                        <p className="text-blue-600 text-xs">Evening rush hours in Amsterdam timezone</p>
                      </div>
                    )}
                    {campaignData.adScheduleTemplateId === 'energie' && (
                      <div>
                        <p className="font-medium text-blue-900">Energie Schedule</p>
                        <p className="text-blue-700">Monday-Friday: 10:00-20:30 (Local Time)</p>
                        <p className="text-blue-600 text-xs">10 AM to 8:30 PM weekdays only</p>
                      </div>
                    )}
                    {campaignData.adScheduleTemplateId !== 'est_business_hours' && 
                     campaignData.adScheduleTemplateId !== 'amsterdam_evening_rush' && 
                     campaignData.adScheduleTemplateId !== 'energie' && (
                      <div>
                        {(() => {
                          const template = adScheduleTemplates.find(t => t.id === campaignData.adScheduleTemplateId)
                          return template ? (
                            <div>
                              <p className="font-medium text-blue-900">{template.name}</p>
                              <p className="text-blue-700">{template.description}</p>
                              <p className="text-blue-600 text-xs">{template.schedule.length} time slots configured</p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAdScheduleManager(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage Custom Schedules
                  </Button>
                </div>
              </div>
            </div>


          </div>
        )

      case 2: // Ad Creation
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

      case 3: // Keywords
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
                      placeholder={index === 0 ? "Enter keywords (comma-separated or one per field)" : `Keyword ${index + 1}`}
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
                Enter keywords relevant to your business. You can enter multiple keywords separated by commas in one field, or use separate fields. Match types: [exact match], "phrase match", broad match (default).
              </p>
            </div>
          </div>
        )

      case 4: // Review & Create
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
                    <Label className="text-sm font-medium text-gray-600">Campaign Type</Label>
                    <p>Search Campaign</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Daily Budget</Label>
                    <p>${campaignData.budget.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Bidding Strategy</Label>
                    <p>Maximize Conversions</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Campaign Type</Label>
                    <p>Search Campaign</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ad Group Name</Label>
                    <p>Ad group1</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                    <p>Today ({new Date().toLocaleDateString()})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ad Group Name</Label>
                    <p>Ad group1</p>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location Targeting</Label>
                    <p>{campaignData.locations.map(loc => getLocationDisplayName(loc)).join(', ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Language</Label>
                    <p>{campaignData.languageCode === 'en' ? 'English' : 
                        campaignData.languageCode === 'es' ? 'Spanish' :
                        campaignData.languageCode === 'fr' ? 'French' :
                        campaignData.languageCode === 'de' ? 'German' :
                        campaignData.languageCode === 'it' ? 'Italian' :
                        campaignData.languageCode === 'nl' ? 'Dutch' : campaignData.languageCode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Device Targeting</Label>
                    <p>{campaignData.deviceTargeting === 'MOBILE_ONLY' ? 'Mobile Only' : 'All Devices'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ad Schedule</Label>
                    <p>
                      {campaignData.adScheduleTemplateId === 'est_business_hours' 
                        ? 'EST Business Hours (9 AM - 9 PM EST)'
                        : campaignData.adScheduleTemplateId === 'amsterdam_evening_rush'
                        ? 'Amsterdam Evening Rush (11 PM - 3 AM AMS)'
                        : campaignData.adScheduleTemplateId === 'energie'
                        ? 'Energie (10 AM - 8:30 PM, Mon-Fri)'
                        : campaignData.adScheduleTemplateId 
                        ? adScheduleTemplates.find(t => t.id === campaignData.adScheduleTemplateId)?.name || 'Custom Schedule'
                        : 'Show ads all day'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Save as Template Section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Save as Template</h4>
                    <p className="text-sm text-blue-700">Save this configuration for future campaigns</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showSaveTemplate ? 'Cancel' : 'Save Template'}
                  </Button>
                </div>

                {showSaveTemplate && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., E-commerce Template"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateDescription">Description</Label>
                      <Input
                        id="templateDescription"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="e.g., Template for e-commerce product campaigns"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (templateName.trim()) {
                          saveAsTemplate(templateName, templateDescription)
                          setTemplateName('')
                          setTemplateDescription('')
                          setShowSaveTemplate(false)
                          // Show success message or toast here if desired
                        }
                      }}
                      disabled={!templateName.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Save Template
                    </Button>
                  </div>
                )}
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
              {selectedTemplate && (
                <span className="block mt-1 text-sm text-purple-600">
                  📋 Using template: <strong>{selectedTemplate.name}</strong>
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplateManager(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Templates
            </Button>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
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