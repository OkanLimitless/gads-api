import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Trash2, Edit, Calendar, DollarSign, Globe, Target } from 'lucide-react'

interface CampaignTemplate {
  id: string
  name: string
  description: string
  data: {
    budget: number
    budgetDeliveryMethod: string
    finalUrl: string
    path1?: string
    path2?: string
    headlines: string[]
    descriptions: string[]
    keywords: string[]
    locations: string[]
    languageCode: string
  }
  createdAt: string
  updatedAt: string
}

interface TemplateManagerProps {
  templates: CampaignTemplate[]
  onSaveTemplates: (templates: CampaignTemplate[]) => void
  onLoadTemplate: (template: CampaignTemplate) => void
  onClose: () => void
}

export default function TemplateManager({ templates, onSaveTemplates, onLoadTemplate, onClose }: TemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const deleteTemplate = (templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId)
    onSaveTemplates(newTemplates)
  }

  const startEdit = (template: CampaignTemplate) => {
    setEditingTemplate(template.id)
    setEditName(template.name)
    setEditDescription(template.description)
  }

  const saveEdit = (templateId: string) => {
    const newTemplates = templates.map(t => 
      t.id === templateId 
        ? { ...t, name: editName, description: editDescription, updatedAt: new Date().toISOString() }
        : t
    )
    onSaveTemplates(newTemplates)
    setEditingTemplate(null)
    setEditName('')
    setEditDescription('')
  }

  const cancelEdit = () => {
    setEditingTemplate(null)
    setEditName('')
    setEditDescription('')
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Settings className="h-6 w-6 mr-2 text-purple-600" />
                Template Manager
              </CardTitle>
              <CardDescription>
                Manage your campaign templates
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Back to Campaign Creation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-4">Create a campaign and save it as a template to get started</p>
              <Button onClick={onClose}>Create Your First Campaign</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    {editingTemplate === template.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="font-medium"
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(template.id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        ${template.data.budget}/day ({template.data.budgetDeliveryMethod === 'ACCELERATED' ? 'Accelerated' : 'Standard'})
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1 text-blue-600" />
                        {template.data.keywords.filter(k => k.trim()).length} keywords
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1 text-purple-600" />
                        {template.data.locations.join(', ')}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-600" />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => onLoadTemplate(template)}
                          className="flex-1"
                        >
                          Use Template
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}