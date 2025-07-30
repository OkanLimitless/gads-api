'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Edit, Trash2, Save, X, FileText, Download, Upload } from 'lucide-react'

interface TemplateData {
  id: string
  name: string
  description: string
  finalUrl: string
  finalMobileUrl?: string
  path1?: string
  path2?: string
  headlines: string[]
  descriptions: string[]
  keywords: string[]
  adGroupName: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<TemplateData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Default empty template
  const emptyTemplate: TemplateData = {
    id: '',
    name: '',
    description: '',
    finalUrl: '',
    finalMobileUrl: '',
    path1: '',
    path2: '',
    headlines: [],
    descriptions: [],
    keywords: [],
    adGroupName: ''
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/template-manager')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      } else {
        setError('Failed to load templates')
      }
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplate = async (template: TemplateData) => {
    try {
      const response = await fetch('/api/template-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })
      
      const data = await response.json()
      if (data.success) {
        setSuccess('Template saved successfully!')
        loadTemplates()
        setEditingTemplate(null)
        setIsCreating(false)
      } else {
        setError(data.error || 'Failed to save template')
      }
    } catch (err) {
      setError('Failed to save template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      const response = await fetch(`/api/template-manager?id=${templateId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        setSuccess('Template deleted successfully!')
        loadTemplates()
      } else {
        setError(data.error || 'Failed to delete template')
      }
    } catch (err) {
      setError('Failed to delete template')
    }
  }

  const handleSave = () => {
    if (!editingTemplate) return
    
    if (!editingTemplate.name || !editingTemplate.finalUrl || 
        editingTemplate.headlines.length < 3 || editingTemplate.descriptions.length < 2 ||
        editingTemplate.keywords.length === 0) {
      setError('Please fill in all required fields: Name, URL, at least 3 headlines, 2 descriptions, and keywords')
      return
    }
    
    saveTemplate(editingTemplate)
  }

  const exportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campaign-templates.json'
    link.click()
  }

  const importTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTemplates = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedTemplates)) {
          setTemplates(prev => [...prev, ...importedTemplates])
          setSuccess(`Imported ${importedTemplates.length} templates`)
        }
      } catch (err) {
        setError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Campaign Template Manager
          </CardTitle>
          <CardDescription>
            Manage your campaign templates. Create up to 100+ templates for random selection in dummy campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => { setIsCreating(true); setEditingTemplate({ ...emptyTemplate, id: Date.now().toString() }) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Template
            </Button>
            
            <Button variant="outline" onClick={exportTemplates} disabled={templates.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Templates
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importTemplates}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Templates
              </Button>
            </div>
            
            <div className="ml-auto text-sm text-gray-600">
              {templates.length} templates
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading templates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span>{template.headlines.length} headlines</span>
                          <span>{template.descriptions.length} descriptions</span>
                          <span>{template.keywords.length} keywords</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 truncate">
                      {template.finalUrl}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Modal */}
      {editingTemplate && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isCreating ? 'Create New Template' : 'Edit Template'}</span>
              <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(null); setIsCreating(false) }}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ad Group Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.adGroupName}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, adGroupName: e.target.value } : null)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                value={editingTemplate.description}
                onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Final URL *</label>
                <input
                  type="url"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.finalUrl}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, finalUrl: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mobile URL</label>
                <input
                  type="url"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.finalMobileUrl || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, finalMobileUrl: e.target.value } : null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Path 1</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.path1 || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, path1: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Path 2</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  value={editingTemplate.path2 || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, path2: e.target.value } : null)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Headlines * (minimum 3, one per line)</label>
              <Textarea
                className="w-full mt-1"
                rows={6}
                placeholder="Enter headlines, one per line..."
                value={editingTemplate.headlines.join('\n')}
                onChange={(e) => setEditingTemplate(prev => prev ? { 
                  ...prev, 
                  headlines: e.target.value.split('\n').filter(h => h.trim()) 
                } : null)}
              />
              <div className="text-xs text-gray-500 mt-1">
                {editingTemplate.headlines.length} headlines
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descriptions * (minimum 2, one per line)</label>
              <Textarea
                className="w-full mt-1"
                rows={4}
                placeholder="Enter descriptions, one per line..."
                value={editingTemplate.descriptions.join('\n')}
                onChange={(e) => setEditingTemplate(prev => prev ? { 
                  ...prev, 
                  descriptions: e.target.value.split('\n').filter(d => d.trim()) 
                } : null)}
              />
              <div className="text-xs text-gray-500 mt-1">
                {editingTemplate.descriptions.length} descriptions
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Keywords * (one per line)</label>
              <Textarea
                className="w-full mt-1"
                rows={4}
                placeholder="Enter keywords, one per line..."
                value={editingTemplate.keywords.join('\n')}
                onChange={(e) => setEditingTemplate(prev => prev ? { 
                  ...prev, 
                  keywords: e.target.value.split('\n').filter(k => k.trim()) 
                } : null)}
              />
              <div className="text-xs text-gray-500 mt-1">
                {editingTemplate.keywords.length} keywords
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => { setEditingTemplate(null); setIsCreating(false) }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}