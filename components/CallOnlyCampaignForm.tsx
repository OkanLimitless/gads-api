import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Target, Settings, Plus, Trash2, Phone } from 'lucide-react'
import AdScheduleManager from './AdScheduleManager'

interface CallOnlyCampaignFormProps {
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

interface AdScheduleTemplateSlot {
  dayOfWeek: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  bidModifier?: number
}

interface AdScheduleTemplate {
  id: string
  name: string
  description: string
  schedule: AdScheduleTemplateSlot[]
  createdAt: string
  updatedAt: string
}

interface CallOnlyCampaignData {
  name: string
  budget: number
  adGroupName: string

  businessName: string
  countryCode: string
  phoneNumber: string
  headline1: string
  headline2: string
  description1: string
  description2: string
  phoneNumberVerificationUrl?: string
  callTracked: boolean
  disableCallConversion: boolean

  keywords: string[]
  locations: string[]
  languageCode: string
  adScheduleTemplateId?: string
}

interface CallOnlyCampaignTemplate {
  id: string
  name: string
  description: string
  data: Omit<CallOnlyCampaignData, 'name'>
  createdAt: string
  updatedAt: string
}

const STEP_TITLES = [
  'Campaign Setup',
  'Targeting',
  'Call Ad',
  'Keywords',
  'Review & Create'
]

export default function CallOnlyCampaignForm({ selectedAccount, onSuccess, onError, onBack }: CallOnlyCampaignFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTemplateChoice, setShowTemplateChoice] = useState(true)
  const [templates, setTemplates] = useState<CallOnlyCampaignTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CallOnlyCampaignTemplate | null>(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [adScheduleTemplates, setAdScheduleTemplates] = useState<AdScheduleTemplate[]>([])
  const [showAdScheduleManager, setShowAdScheduleManager] = useState(false)

  const [campaignData, setCampaignData] = useState<CallOnlyCampaignData>({
    name: '',
    budget: 10,
    adGroupName: 'Ad group1',
    businessName: '',
    countryCode: 'US',
    phoneNumber: '',
    headline1: '',
    headline2: '',
    description1: '',
    description2: '',
    callTracked: true,
    disableCallConversion: false,
    keywords: [''],
    locations: ['US'],
    languageCode: 'en',
    adScheduleTemplateId: undefined
  })

  useEffect(() => {
    const saved = localStorage.getItem('callOnlyCampaignTemplates')
    if (saved) setTemplates(JSON.parse(saved))

    const savedAdSchedules = localStorage.getItem('adScheduleTemplates')
    if (savedAdSchedules) setAdScheduleTemplates(JSON.parse(savedAdSchedules))
  }, [])

  const saveTemplates = (newTemplates: CallOnlyCampaignTemplate[]) => {
    localStorage.setItem('callOnlyCampaignTemplates', JSON.stringify(newTemplates))
    setTemplates(newTemplates)
  }

  const saveAdScheduleTemplates = (newTemplates: AdScheduleTemplate[]) => {
    localStorage.setItem('adScheduleTemplates', JSON.stringify(newTemplates))
    setAdScheduleTemplates(newTemplates)
  }

  const loadTemplate = (template: CallOnlyCampaignTemplate) => {
    setCampaignData(prev => ({
      ...template.data,
      name: prev.name
    }))
    setSelectedTemplate(template)
    setShowTemplateChoice(false)
  }

  const saveAsTemplate = (name: string, description: string) => {
    const template: CallOnlyCampaignTemplate = {
      id: Date.now().toString(),
      name,
      description,
      data: {
        budget: campaignData.budget,
        adGroupName: campaignData.adGroupName,
        businessName: campaignData.businessName,
        countryCode: campaignData.countryCode,
        phoneNumber: campaignData.phoneNumber,
        headline1: campaignData.headline1,
        headline2: campaignData.headline2,
        description1: campaignData.description1,
        description2: campaignData.description2,
        phoneNumberVerificationUrl: campaignData.phoneNumberVerificationUrl,
        callTracked: campaignData.callTracked,
        disableCallConversion: campaignData.disableCallConversion,
        keywords: campaignData.keywords,
        locations: campaignData.locations,
        languageCode: campaignData.languageCode,
        adScheduleTemplateId: campaignData.adScheduleTemplateId
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const next = [...templates, template]
    saveTemplates(next)
    return template
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    switch (step) {
      case 0:
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required'
        if (campaignData.budget < 1) newErrors.budget = 'Minimum budget is $1.00'
        break
      case 1:
        if (campaignData.locations.length === 0) newErrors.locations = 'At least one location is required'
        break
      case 2:
        if (!campaignData.businessName.trim()) newErrors.businessName = 'Business name is required'
        if (!campaignData.countryCode.trim()) newErrors.countryCode = 'Country code is required'
        if (!campaignData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
        if (!campaignData.headline1.trim()) newErrors.headline1 = 'Headline 1 is required'
        if (!campaignData.headline2.trim()) newErrors.headline2 = 'Headline 2 is required'
        if (!campaignData.description1.trim()) newErrors.description1 = 'Description 1 is required'
        if (!campaignData.description2.trim()) newErrors.description2 = 'Description 2 is required'
        break
      case 3:
        if (campaignData.keywords.filter(k => k.trim()).length === 0) newErrors.keywords = 'At least one keyword is required'
        break
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(s => Math.min(s + 1, STEP_TITLES.length - 1))
  }
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0))

  const updateField = (field: keyof CallOnlyCampaignData, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field]: '' }))
  }
  const addArrayItem = (field: 'keywords') => {
    setCampaignData(prev => ({ ...prev, [field]: [...prev[field], ''] }))
  }
  const updateArrayItem = (field: 'keywords', index: number, value: string) => {
    setCampaignData(prev => ({ ...prev, [field]: prev[field].map((v, i) => i === index ? value : v) }))
  }
  const removeArrayItem = (field: 'keywords', index: number) => {
    setCampaignData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/call-campaigns/${selectedAccount.id}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignData: {
            name: campaignData.name,
            budgetAmountMicros: campaignData.budget * 1000000,
            biddingStrategy: 'MAXIMIZE_CONVERSIONS',
            campaignType: 'SEARCH',
            startDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
            adGroupName: campaignData.adGroupName,
            defaultBidMicros: 1000000,

            businessName: campaignData.businessName,
            countryCode: campaignData.countryCode,
            phoneNumber: campaignData.phoneNumber,
            headline1: campaignData.headline1,
            headline2: campaignData.headline2,
            description1: campaignData.description1,
            description2: campaignData.description2,
            phoneNumberVerificationUrl: campaignData.phoneNumberVerificationUrl,
            callTracked: campaignData.callTracked,
            disableCallConversion: campaignData.disableCallConversion,

            keywords: campaignData.keywords.filter(k => k.trim().length > 0),
            locations: campaignData.locations,
            languageCode: campaignData.languageCode,
            adScheduleTemplateId: campaignData.adScheduleTemplateId,
            adScheduleTemplate: campaignData.adScheduleTemplateId 
              ? adScheduleTemplates.find(t => t.id === campaignData.adScheduleTemplateId) 
              : undefined,
          }
        })
      })
      const result = await response.json()
      if (result.success) {
        setIsSuccess(true)
        setSuccessData(result)
        onSuccess?.(result)
      } else {
        onError?.(result.error || 'Failed to create call-only campaign')
      }
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Call-Only Campaign Created!</CardTitle>
            <CardDescription>
              Your campaign "{campaignData.name}" has been created.
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
              <Button onClick={onBack} className="w-full">Create Another Campaign</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showAdScheduleManager) {
    return (
      <AdScheduleManager
        templates={adScheduleTemplates}
        onSaveTemplates={setAdScheduleTemplates}
        onClose={() => setShowAdScheduleManager(false)}
      />
    )
  }

  if (showTemplateChoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Phone className="h-6 w-6 mr-2 text-blue-600" />
              Create Call-Only Campaign
            </CardTitle>
            <CardDescription>Choose how you'd like to start</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-purple-600" />
                    Use Saved Template
                  </CardTitle>
                  <CardDescription>Load from your call-only templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {templates.length === 0 ? (
                    <div className="text-sm text-gray-600">No templates saved yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <Button key={t.id} variant="outline" className="w-full" onClick={() => loadTemplate(t)}>
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowTemplateChoice(false)}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-green-600" />
                    Create From Scratch
                  </CardTitle>
                  <CardDescription>Start with a blank call-only campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p className="font-medium">Build from scratch</p>
                    <p className="text-sm text-gray-600">Full control over all settings</p>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Start Creating</Button>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="campaignName">Campaign Name *</Label>
              <Input id="campaignName" value={campaignData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g., Calls Campaign - Q3" className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="budget">Daily Budget ($) *</Label>
              <Input id="budget" type="number" min="1" step="1" value={campaignData.budget} onChange={(e) => updateField('budget', parseFloat(e.target.value) || 0)} className={errors.budget ? 'border-red-500' : ''} placeholder="e.g., 10" />
              <p className="text-sm text-gray-500 mt-1">Amount in dollars (e.g., 10 = $10/day)</p>
              {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
            </div>
            <div>
              <Label htmlFor="adGroupName">Ad Group Name</Label>
              <Input id="adGroupName" value={campaignData.adGroupName} onChange={(e) => updateField('adGroupName', e.target.value)} />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>Location Targeting *</Label>
              <Select value={campaignData.locations[0]} onValueChange={(value) => updateField('locations', [value])}>
                <SelectTrigger className={errors.locations ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States (All States)</SelectItem>
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
              <Select value={campaignData.languageCode} onValueChange={(value) => updateField('languageCode', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ad Schedule (Optional)</Label>
              <div className="space-y-3">
                <Select value={campaignData.adScheduleTemplateId || 'none'} onValueChange={(value) => updateField('adScheduleTemplateId', value === 'none' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Schedule (All day)</SelectItem>
                    <SelectItem value="est_business_hours">EST Business Hours</SelectItem>
                    <SelectItem value="amsterdam_evening_rush">Amsterdam Evening Rush</SelectItem>
                    {adScheduleTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} (Custom)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAdScheduleManager(true)}>
                    <Settings className="h-4 w-4 mr-1" /> Manage Custom Schedules
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" value={campaignData.businessName} onChange={(e) => updateField('businessName', e.target.value)} className={errors.businessName ? 'border-red-500' : ''} />
              {errors.businessName && <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="countryCode">Country Code *</Label>
                <Select value={campaignData.countryCode} onValueChange={(value) => updateField('countryCode', value)}>
                  <SelectTrigger className={errors.countryCode ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="NL">NL</SelectItem>
                    <SelectItem value="GB">GB</SelectItem>
                    <SelectItem value="CA">CA</SelectItem>
                    <SelectItem value="AU">AU</SelectItem>
                    <SelectItem value="DE">DE</SelectItem>
                    <SelectItem value="FR">FR</SelectItem>
                  </SelectContent>
                </Select>
                {errors.countryCode && <p className="text-sm text-red-500 mt-1">{errors.countryCode}</p>}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" value={campaignData.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} placeholder="e.g., 5551234567" className={errors.phoneNumber ? 'border-red-500' : ''} />
                {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headline1">Headline 1 *</Label>
                <Input id="headline1" value={campaignData.headline1} onChange={(e) => updateField('headline1', e.target.value)} maxLength={30} className={errors.headline1 ? 'border-red-500' : ''} />
                {errors.headline1 && <p className="text-sm text-red-500 mt-1">{errors.headline1}</p>}
              </div>
              <div>
                <Label htmlFor="headline2">Headline 2 *</Label>
                <Input id="headline2" value={campaignData.headline2} onChange={(e) => updateField('headline2', e.target.value)} maxLength={30} className={errors.headline2 ? 'border-red-500' : ''} />
                {errors.headline2 && <p className="text-sm text-red-500 mt-1">{errors.headline2}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description1">Description 1 *</Label>
                <Textarea id="description1" value={campaignData.description1} onChange={(e) => updateField('description1', e.target.value)} rows={2} maxLength={90} className={errors.description1 ? 'border-red-500' : ''} />
                {errors.description1 && <p className="text-sm text-red-500 mt-1">{errors.description1}</p>}
              </div>
              <div>
                <Label htmlFor="description2">Description 2 *</Label>
                <Textarea id="description2" value={campaignData.description2} onChange={(e) => updateField('description2', e.target.value)} rows={2} maxLength={90} className={errors.description2 ? 'border-red-500' : ''} />
                {errors.description2 && <p className="text-sm text-red-500 mt-1">{errors.description2}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="verificationUrl">Phone Verification URL (Optional)</Label>
              <Input id="verificationUrl" value={campaignData.phoneNumberVerificationUrl || ''} onChange={(e) => updateField('phoneNumberVerificationUrl', e.target.value)} placeholder="https://your-site.com/contact" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input id="callTracked" type="checkbox" checked={campaignData.callTracked} onChange={(e) => updateField('callTracked', e.target.checked)} />
                <Label htmlFor="callTracked">Enable Call Tracking</Label>
              </div>
              <div className="flex items-center gap-2">
                <input id="disableConversion" type="checkbox" checked={campaignData.disableCallConversion} onChange={(e) => updateField('disableCallConversion', e.target.checked)} />
                <Label htmlFor="disableConversion">Disable Call Conversion</Label>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Keywords *</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('keywords')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {campaignData.keywords.map((keyword, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={keyword} onChange={(e) => updateArrayItem('keywords', index, e.target.value)} placeholder={index === 0 ? 'Enter keywords (comma-separated or one per field)' : `Keyword ${index + 1}`} />
                    {campaignData.keywords.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeArrayItem('keywords', index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.keywords && <p className="text-sm text-red-500 mt-1">{errors.keywords}</p>}
              <p className="text-sm text-gray-500 mt-2">Match types supported: [exact], "phrase", or broad (default).</p>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Call-Only Campaign</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Campaign Name</Label>
                    <p>{campaignData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Campaign Type</Label>
                    <p>Search (Call-Only Ad)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Daily Budget</Label>
                    <p>${campaignData.budget.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Ad Group Name</Label>
                    <p>{campaignData.adGroupName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p>{campaignData.locations.join(', ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Language</Label>
                    <p>{campaignData.languageCode}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Call Ad</Label>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium">{campaignData.businessName}</div>
                    <div>{campaignData.headline1} · {campaignData.headline2}</div>
                    <div className="text-sm text-gray-600">{campaignData.description1} · {campaignData.description2}</div>
                    <div className="text-sm mt-1">{campaignData.countryCode} {campaignData.phoneNumber}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Keywords</Label>
                  <p>{campaignData.keywords.filter(k => k.trim()).join(', ')}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Save as Template</h4>
                    <p className="text-sm text-blue-700">Save this configuration for future call-only campaigns</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowSaveTemplate(!showSaveTemplate)} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <Settings className="h-4 w-4 mr-2" /> {showSaveTemplate ? 'Cancel' : 'Save Template'}
                  </Button>
                </div>
                {showSaveTemplate && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="templateName">Template Name *</Label>
                      <Input id="templateName" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., US - Pest Control Calls" />
                    </div>
                    <div>
                      <Label htmlFor="templateDescription">Description</Label>
                      <Input id="templateDescription" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Optional description" />
                    </div>
                    <Button onClick={() => { if (templateName.trim()) { saveAsTemplate(templateName, templateDescription); setTemplateName(''); setTemplateDescription(''); setShowSaveTemplate(false) } }} disabled={!templateName.trim()} className="w-full bg-blue-600 hover:bg-blue-700">Save Template</Button>
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
              <Phone className="h-5 w-5 mr-2 text-blue-600" />
              Create Call-Only Campaign - {STEP_TITLES[currentStep]}
            </CardTitle>
            <CardDescription>
              Creating campaign for: <strong>{selectedAccount.name}</strong>
              <span className="block mt-1 text-sm text-gray-500">Account ID: {selectedAccount.id}</span>
              {selectedTemplate && (
                <span className="block mt-1 text-sm text-purple-600">📋 Using template: <strong>{selectedTemplate.name}</strong></span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          {STEP_TITLES.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep ? 'bg-green-500 text-white' : index === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {renderStep()}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          {currentStep < STEP_TITLES.length - 1 ? (
            <Button onClick={nextStep}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Campaign...</>) : (<><Target className="h-4 w-4 mr-2" /> Create Campaign</>)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

