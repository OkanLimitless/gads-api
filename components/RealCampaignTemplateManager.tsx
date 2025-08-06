import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle, Flag, Target, Globe } from 'lucide-react'

// Helper function to get language display name
const getLanguageDisplayName = (languageCode?: string): string => {
  const languageMap: Record<string, string> = {
    'ar': 'Arabic',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'zh': 'Chinese (Simplified)',
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'et': 'Estonian',
    'fi': 'Finnish',
    'fr': 'French',
    'de': 'German',
    'el': 'Greek',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'hu': 'Hungarian',
    'id': 'Indonesian',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'ms': 'Malay',
    'no': 'Norwegian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sr': 'Serbian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'es': 'Spanish',
    'sv': 'Swedish',
    'th': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'vi': 'Vietnamese'
  }
  
  return languageMap[languageCode || 'en'] || 'English'
}

interface RealCampaignTemplate {
  _id?: string
  name: string
  description: string
  category: 'NL' | 'US'
  data: {
    budget: number
    finalUrl: string
    path1?: string
    path2?: string
    headlines: string[]
    descriptions: string[]
    keywords: string[]
    locations: string[]
    languageCode: string
    adScheduleTemplateId?: string
    deviceTargeting: 'ALL' | 'MOBILE_ONLY'
  }
  createdAt: string
  updatedAt: string
}

interface RealCampaignTemplateManagerProps {
  onSelectTemplate?: (template: RealCampaignTemplate) => void
  onBack?: () => void
  mode?: 'manager' | 'selector' // Manager for full CRUD, Selector for choosing templates
}

export default function RealCampaignTemplateManager({ 
  onSelectTemplate, 
  onBack, 
  mode = 'manager' 
}: RealCampaignTemplateManagerProps) {
  const [templates, setTemplates] = useState<RealCampaignTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RealCampaignTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'NL' | 'US' | 'ALL'>('ALL')

  // Default empty template
  const emptyTemplate: RealCampaignTemplate = {
    name: '',
    description: '',
    category: 'US',
    data: {
      budget: 10,
      finalUrl: '',
      path1: '',
      path2: '',
      headlines: ['', '', ''],
      descriptions: ['', ''],
      keywords: [''],
      locations: ['US'],
      languageCode: 'en',
      deviceTargeting: 'ALL'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const [currentTemplate, setCurrentTemplate] = useState<RealCampaignTemplate>(emptyTemplate)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/campaign-templates')
      const data = await response.json()
      
      if (response.ok && data.success) {
        setTemplates(data.templates)
        console.log(`✅ Loaded ${data.templates.length} real campaign templates`)
      } else {
        setError(data.error || 'Failed to load templates')
      }
    } catch (err) {
      console.error('💥 Error loading templates:', err)
      setError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplate = async (template: RealCampaignTemplate) => {
    setError(null)
    setSuccess(null)
    
    try {
      // Filter out empty headlines, descriptions, and keywords
      const cleanedTemplate = {
        ...template,
        data: {
          ...template.data,
          headlines: template.data.headlines.filter(h => h.trim()),
          descriptions: template.data.descriptions.filter(d => d.trim()),
          keywords: template.data.keywords.filter(k => k.trim())
        }
      }

      const response = await fetch('/api/campaign-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedTemplate)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess(template._id ? 'Template updated successfully!' : 'Template created successfully!')
        setEditingTemplate(null)
        setIsCreating(false)
        loadTemplates()
      } else {
        setError(result.error || 'Failed to save template')
      }
    } catch (err) {
      console.error('💥 Error saving template:', err)
      setError('Failed to save template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    setError(null)
    try {
      const response = await fetch(`/api/campaign-templates?id=${templateId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('Template deleted successfully!')
        loadTemplates()
      } else {
        setError(result.error || 'Failed to delete template')
      }
    } catch (err) {
      console.error('💥 Error deleting template:', err)
      setError('Failed to delete template')
    }
  }

  const filteredTemplates = selectedCategory === 'ALL' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const nlTemplates = templates.filter(t => t.category === 'NL')
  const usTemplates = templates.filter(t => t.category === 'US')

  // Update currentTemplate when editing starts
  useEffect(() => {
    if (editingTemplate) {
      setCurrentTemplate(editingTemplate)
    } else if (isCreating) {
      setCurrentTemplate(emptyTemplate)
    }
  }, [editingTemplate, isCreating])

  if (isCreating || editingTemplate) {
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <p className="text-gray-600">
              {editingTemplate ? 'Update template details' : 'Create a new campaign template'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditingTemplate(null)
              setIsCreating(false)
              setError(null)
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={currentTemplate.name}
                  onChange={(e) => {
                    setCurrentTemplate({ ...currentTemplate, name: e.target.value })
                  }}
                  placeholder="Enter template name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={currentTemplate.category}
                  onValueChange={(value: 'NL' | 'US') => {
                    setCurrentTemplate({ 
                      ...currentTemplate, 
                      category: value,
                      data: {
                        ...currentTemplate.data,
                        locations: value === 'NL' ? ['NL'] : ['US'],
                        languageCode: value === 'NL' ? 'nl' : 'en'
                      }
                    })
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NL">
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-2" />
                        Netherlands (NL)
                      </div>
                    </SelectItem>
                    <SelectItem value="US">
                      <div className="flex items-center">
                        <Flag className="h-4 w-4 mr-2" />
                        United States (US)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={currentTemplate.description}
                onChange={(e) => {
                  setCurrentTemplate({ ...currentTemplate, description: e.target.value })
                }}
                placeholder="Enter template description"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Daily Budget (€) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  value={currentTemplate.data.budget}
                  onChange={(e) => {
                    setCurrentTemplate({
                      ...currentTemplate,
                      data: { ...currentTemplate.data, budget: parseInt(e.target.value) || 1 }
                    })
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="finalUrl">Final URL *</Label>
                <Input
                  id="finalUrl"
                  value={currentTemplate.data.finalUrl}
                  onChange={(e) => {
                    setCurrentTemplate({
                      ...currentTemplate,
                      data: { ...currentTemplate.data, finalUrl: e.target.value }
                    })
                  }}
                  placeholder="https://example.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Headlines * (minimum 3)</Label>
              <Textarea
                value={currentTemplate.data.headlines.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n')
                  setCurrentTemplate({
                    ...currentTemplate,
                    data: { ...currentTemplate.data, headlines: lines }
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
                placeholder="Enter headlines, one per line..."
                rows={4}
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentTemplate.data.headlines.filter(h => h.trim()).length} headlines
              </div>
            </div>

            <div>
              <Label>Descriptions * (minimum 2)</Label>
              <Textarea
                value={currentTemplate.data.descriptions.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n')
                  setCurrentTemplate({
                    ...currentTemplate,
                    data: { ...currentTemplate.data, descriptions: lines }
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
                placeholder="Enter descriptions, one per line..."
                rows={3}
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentTemplate.data.descriptions.filter(d => d.trim()).length} descriptions
              </div>
            </div>

            <div>
              <Label>Keywords *</Label>
              <Textarea
                value={currentTemplate.data.keywords.join('\n')}
                onChange={(e) => {
                  const lines = e.target.value.split('\n')
                  setCurrentTemplate({
                    ...currentTemplate,
                    data: { ...currentTemplate.data, keywords: lines }
                  })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                  }
                }}
                placeholder="Enter keywords, one per line..."
                rows={4}
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {currentTemplate.data.keywords.filter(k => k.trim()).length} keywords
              </div>
            </div>

            <Button
              onClick={() => saveTemplate(currentTemplate)}
              disabled={
                !currentTemplate.name.trim() ||
                !currentTemplate.data.finalUrl.trim() ||
                currentTemplate.data.headlines.filter(h => h.trim()).length < 3 ||
                currentTemplate.data.descriptions.filter(d => d.trim()).length < 2 ||
                currentTemplate.data.keywords.filter(k => k.trim()).length === 0
              }
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'selector' ? 'Select Campaign Template' : 'Real Campaign Templates'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'selector' ? 'Choose a template for your campaign' : 'Manage templates for real campaigns (separate from dummy templates)'}
          </p>
        </div>
        <div className="flex space-x-2">
          {mode === 'manager' && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as 'NL' | 'US' | 'ALL')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ALL">
            <Globe className="h-4 w-4 mr-2" />
            All ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="NL">
            <Flag className="h-4 w-4 mr-2" />
            Netherlands ({nlTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="US">
            <Flag className="h-4 w-4 mr-2" />
            United States ({usTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading templates...</span>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={template.category === 'NL' ? 'default' : 'secondary'}>
                        {template.category}
                      </Badge>
                    </div>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Budget: €{template.data.budget}/day</div>
                      <div>Headlines: {template.data.headlines.filter(h => h.trim()).length}</div>
                      <div>Descriptions: {template.data.descriptions.filter(d => d.trim()).length}</div>
                      <div>Keywords: {template.data.keywords.filter(k => k.trim()).length}</div>
                      <div>Language: {getLanguageDisplayName(template.data.languageCode)}</div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      {mode === 'selector' && onSelectTemplate && (
                        <Button
                          size="sm"
                          onClick={() => onSelectTemplate(template)}
                          className="flex-1"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      )}
                      
                      {mode === 'manager' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTemplate(template)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTemplate(template._id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedCategory !== 'ALL' ? selectedCategory : ''} templates yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first {selectedCategory !== 'ALL' ? selectedCategory : ''} campaign template to get started
              </p>
              {mode === 'manager' && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}