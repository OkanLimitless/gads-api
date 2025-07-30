'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, CheckCircle, AlertCircle, Target, Users, FileText } from 'lucide-react'
import { getTemplateOptions } from '@/lib/dummy-campaign-templates'

interface EligibleAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  campaignCount: number
}

interface TemplateOption {
  id: string
  name: string
  description: string
}

interface CampaignCreationResult {
  accountId: string
  success: boolean
  message?: string
  error?: string
  templateUsed?: string
  campaignDetails?: {
    name: string
    budget: number
    keywords: number
    headlines: number
    descriptions: number
  }
}

export default function DummyCampaignManager() {
  const [eligibleAccounts, setEligibleAccounts] = useState<EligibleAccount[]>([])
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<CampaignCreationResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load eligible accounts and templates on component mount
  useEffect(() => {
    loadEligibleAccounts()
    loadTemplates()
  }, [])

  const loadEligibleAccounts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/dummy-campaigns/eligible-accounts')
      const data = await response.json()
      
      if (data.success) {
        setEligibleAccounts(data.eligibleAccounts)
        console.log(`✅ Loaded ${data.eligibleAccounts.length} eligible accounts`)
      } else {
        setError(data.error || 'Failed to load eligible accounts')
      }
    } catch (err) {
      console.error('Error loading eligible accounts:', err)
      setError('Failed to load eligible accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = () => {
    const templateOptions = getTemplateOptions()
    setTemplates(templateOptions)
    console.log(`✅ Loaded ${templateOptions.length} templates`)
  }

  const toggleAccountSelection = (accountId: string) => {
    const newSelection = new Set(selectedAccounts)
    if (newSelection.has(accountId)) {
      newSelection.delete(accountId)
    } else {
      newSelection.add(accountId)
    }
    setSelectedAccounts(newSelection)
  }

  const selectAllAccounts = () => {
    if (selectedAccounts.size === eligibleAccounts.length) {
      setSelectedAccounts(new Set())
    } else {
      setSelectedAccounts(new Set(eligibleAccounts.map(account => account.id)))
    }
  }

  const createDummyCampaigns = async () => {
    if (!selectedTemplate || selectedAccounts.size === 0) {
      setError('Please select a template and at least one account')
      return
    }

    setIsCreating(true)
    setResults([])
    setError(null)

    const creationResults: CampaignCreationResult[] = []
    const selectedAccountIds = Array.from(selectedAccounts)

    console.log(`🚀 Creating dummy campaigns for ${selectedAccountIds.length} accounts using template ${selectedTemplate}`)

    for (const accountId of selectedAccountIds) {
      try {
        console.log(`📊 Creating dummy campaign for account ${accountId}...`)
        
        const response = await fetch('/api/dummy-campaigns/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
            templateId: selectedTemplate,
            customizations: {} // Can be extended later for custom modifications
          }),
        })

        const result = await response.json()
        
        creationResults.push({
          accountId,
          success: result.success,
          message: result.message,
          error: result.error,
          templateUsed: result.templateUsed,
          campaignDetails: result.campaignDetails
        })

        if (result.success) {
          console.log(`✅ Dummy campaign created for account ${accountId}`)
        } else {
          console.error(`❌ Failed to create dummy campaign for account ${accountId}:`, result.error)
        }

      } catch (err) {
        console.error(`💥 Error creating dummy campaign for account ${accountId}:`, err)
        creationResults.push({
          accountId,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error occurred'
        })
      }
    }

    setResults(creationResults)
    setIsCreating(false)

    // Refresh eligible accounts list to update campaign counts
    loadEligibleAccounts()
  }

  const getAccountName = (accountId: string) => {
    const account = eligibleAccounts.find(acc => acc.id === accountId)
    return account?.name || `Account ${accountId}`
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dummy Campaign Manager
          </CardTitle>
          <CardDescription>
            Create dummy campaigns on client accounts with 0 existing campaigns using predefined templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Campaign Template
            </label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eligible Accounts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Eligible Accounts (0 campaigns)
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {eligibleAccounts.length} eligible accounts
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllAccounts}
                  disabled={isLoading || eligibleAccounts.length === 0}
                >
                  {selectedAccounts.size === eligibleAccounts.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEligibleAccounts}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading eligible accounts...</span>
              </div>
            ) : eligibleAccounts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No eligible accounts found. All client accounts already have campaigns or cannot be accessed.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {eligibleAccounts.map((account) => (
                  <Card
                    key={account.id}
                    className={`cursor-pointer transition-all ${
                      selectedAccounts.has(account.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => toggleAccountSelection(account.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{account.name}</h4>
                          <p className="text-xs text-gray-500">ID: {account.id}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {account.currency}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              0 campaigns
                            </Badge>
                          </div>
                        </div>
                        {selectedAccounts.has(account.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedAccounts.size > 0 && (
                <span>{selectedAccounts.size} account{selectedAccounts.size === 1 ? '' : 's'} selected</span>
              )}
            </div>
            <Button
              onClick={createDummyCampaigns}
              disabled={!selectedTemplate || selectedAccounts.size === 0 || isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isCreating
                ? `Creating... (${results.length}/${selectedAccounts.size})`
                : 'Create Dummy Campaigns'
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Campaign Creation Results
            </CardTitle>
            <CardDescription>
              {successCount} successful, {failureCount} failed out of {results.length} total attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card
                  key={`${result.accountId}-${index}`}
                  className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <h4 className="font-medium text-sm">
                            {getAccountName(result.accountId)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            ID: {result.accountId}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.message || result.error}
                        </p>
                        
                        {result.success && result.campaignDetails && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                            <span>Budget: ${result.campaignDetails.budget}/day</span>
                            <span>Keywords: {result.campaignDetails.keywords}</span>
                            <span>Headlines: {result.campaignDetails.headlines}</span>
                            <span>Descriptions: {result.campaignDetails.descriptions}</span>
                          </div>
                        )}
                      </div>
                      
                      {result.templateUsed && (
                        <Badge variant="secondary" className="text-xs">
                          {result.templateUsed}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}