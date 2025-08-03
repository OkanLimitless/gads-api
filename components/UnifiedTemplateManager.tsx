import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, CheckCircle, Settings, Target, FileText, Flag, Globe, ArrowLeft } from 'lucide-react'
import RealCampaignTemplateManager from './RealCampaignTemplateManager'
import TemplateManager from './TemplateManager'

interface UnifiedTemplateManagerProps {
  onBack?: () => void
}

interface LegacyTemplate {
  id: string
  name: string
  description: string
  data: any
  createdAt: string
  updatedAt: string
}

export default function UnifiedTemplateManager({ onBack }: UnifiedTemplateManagerProps) {
  const [legacyTemplates, setLegacyTemplates] = useState<LegacyTemplate[]>([])
  const [realTemplateStats, setRealTemplateStats] = useState({ total: 0, nl: 0, us: 0 })
  const [dummyTemplateStats, setDummyTemplateStats] = useState({ total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('real')

  useEffect(() => {
    loadAllTemplateStats()
  }, [])

  const loadAllTemplateStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load legacy templates from localStorage
      const savedTemplates = localStorage.getItem('campaignTemplates')
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates)
        setLegacyTemplates(Array.isArray(parsed) ? parsed : [])
      }

      // Load real template stats
      try {
        const realResponse = await fetch('/api/campaign-templates')
        const realData = await realResponse.json()
        if (realData.success) {
          const nlCount = realData.templates.filter((t: any) => t.category === 'NL').length
          const usCount = realData.templates.filter((t: any) => t.category === 'US').length
          setRealTemplateStats({
            total: realData.templates.length,
            nl: nlCount,
            us: usCount
          })
        }
      } catch (err) {
        console.error('Error loading real templates:', err)
      }

      // Load dummy template stats
      try {
        const dummyResponse = await fetch('/api/template-manager')
        const dummyData = await dummyResponse.json()
        if (dummyData.success) {
          setDummyTemplateStats({
            total: dummyData.templates.length
          })
        }
      } catch (err) {
        console.error('Error loading dummy templates:', err)
      }

    } catch (err) {
      console.error('Error loading template stats:', err)
      setError('Failed to load template statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const migrateLegacyTemplate = async (template: LegacyTemplate, category: 'NL' | 'US') => {
    try {
      const realTemplate = {
        name: `${template.name} (Migrated)`,
        description: template.description || 'Migrated from legacy templates',
        category,
        data: {
          budget: template.data.budget || 10,
          finalUrl: template.data.finalUrl || '',
          path1: template.data.path1 || '',
          path2: template.data.path2 || '',
          headlines: template.data.headlines || [''],
          descriptions: template.data.descriptions || [''],
          keywords: template.data.keywords || [''],
          locations: category === 'NL' ? ['NL'] : ['US'],
          languageCode: category === 'NL' ? 'nl' : 'en',
          adScheduleTemplateId: template.data.adScheduleTemplateId,
          deviceTargeting: template.data.deviceTargeting || 'ALL'
        }
      }

      const response = await fetch('/api/campaign-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(realTemplate)
      })

      const result = await response.json()
      if (result.success) {
        setSuccess(`Template "${template.name}" migrated to ${category} category!`)
        loadAllTemplateStats()
      } else {
        setError(`Failed to migrate template: ${result.error}`)
      }
    } catch (err) {
      setError(`Failed to migrate template: ${err}`)
    }
  }

  const clearLegacyTemplates = () => {
    if (confirm('Are you sure you want to clear all legacy templates? This cannot be undone.')) {
      localStorage.removeItem('campaignTemplates')
      setLegacyTemplates([])
      setSuccess('Legacy templates cleared!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage all your campaign templates in one place
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
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

      {/* Template Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Real Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTemplateStats.total}</div>
            <div className="text-xs text-gray-500">
              {realTemplateStats.nl} NL • {realTemplateStats.us} US
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dummy Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dummyTemplateStats.total}</div>
            <div className="text-xs text-gray-500">For dummy campaigns</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Legacy Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{legacyTemplates.length}</div>
            <div className="text-xs text-gray-500">
              {legacyTemplates.length > 0 ? 'Need migration' : 'All migrated'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTemplateStats.total + dummyTemplateStats.total + legacyTemplates.length}
            </div>
            <div className="text-xs text-gray-500">Across all systems</div>
          </CardContent>
        </Card>
      </div>

      {/* Template Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="real">
            <Target className="h-4 w-4 mr-2" />
            Real Templates ({realTemplateStats.total})
          </TabsTrigger>
          <TabsTrigger value="dummy">
            <FileText className="h-4 w-4 mr-2" />
            Dummy Templates ({dummyTemplateStats.total})
          </TabsTrigger>
          <TabsTrigger value="legacy">
            <Settings className="h-4 w-4 mr-2" />
            Legacy Templates ({legacyTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Globe className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Real Campaign Templates */}
        <TabsContent value="real" className="space-y-4">
          <RealCampaignTemplateManager mode="manager" />
        </TabsContent>

        {/* Dummy Templates */}
        <TabsContent value="dummy" className="space-y-4">
          <TemplateManager />
        </TabsContent>

        {/* Legacy Templates */}
        <TabsContent value="legacy" className="space-y-4">
          {legacyTemplates.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Legacy Templates</h3>
                  <p className="text-sm text-gray-600">
                    These templates were stored in localStorage. Migrate them to the new system.
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={clearLegacyTemplates}>
                  Clear All Legacy
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {legacyTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">Legacy</Badge>
                      </div>
                      {template.description && (
                        <CardDescription>{template.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Budget: ${template.data.budget || 'N/A'}/day</div>
                        <div>Headlines: {template.data.headlines?.length || 0}</div>
                        <div>Descriptions: {template.data.descriptions?.length || 0}</div>
                        <div>Keywords: {template.data.keywords?.length || 0}</div>
                        <div>Created: {new Date(template.createdAt).toLocaleDateString()}</div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Migrate to:</p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => migrateLegacyTemplate(template, 'NL')}
                            className="flex-1"
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            NL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => migrateLegacyTemplate(template, 'US')}
                            className="flex-1"
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            US
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Legacy Templates</h3>
              <p className="text-gray-500">
                All your templates have been migrated to the new system!
              </p>
            </div>
          )}
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Real Campaign Templates
                </CardTitle>
                <CardDescription>
                  Templates for actual campaigns, organized by market (NL/US)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Netherlands (NL)</span>
                    <Badge>{realTemplateStats.nl}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">United States (US)</span>
                    <Badge variant="secondary">{realTemplateStats.us}</Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center font-medium">
                      <span>Total Real Templates</span>
                      <Badge variant="default">{realTemplateStats.total}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Dummy Campaign Templates
                </CardTitle>
                <CardDescription>
                  Templates for dummy campaigns (€3 budget, testing purposes)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available Templates</span>
                    <Badge>{dummyTemplateStats.total}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    Used for testing campaigns before deploying real ones
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {legacyTemplates.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {legacyTemplates.length} legacy templates that need migration. 
                Go to the "Legacy Templates" tab to migrate them to the new system.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}