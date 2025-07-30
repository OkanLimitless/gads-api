'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, CheckCircle, AlertCircle, Target, Users, FileText } from 'lucide-react'


interface EligibleAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  campaignCount: number
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
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<CampaignCreationResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Load eligible accounts on component mount
  useEffect(() => {
    loadEligibleAccounts()
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
        
        // Debug information
        if (data.debug) {
          console.log('🔍 Debug Information:')
          console.log(`📊 Summary: ${data.debug.summary.successCount} success, ${data.debug.summary.errorCount} errors, ${data.debug.summary.eligibleCount} eligible`)
          console.log('📋 Sample accounts:', data.debug.accountResults)
          setDebugInfo(data.debug)
        }
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
    if (selectedAccounts.size === 0) {
      setError('Please select at least one account')
      return
    }

    setIsCreating(true)
    setResults([])
    setError(null)

    const creationResults: CampaignCreationResult[] = []
    const selectedAccountIds = Array.from(selectedAccounts)

    console.log(`🚀 Creating dummy campaigns for ${selectedAccountIds.length} accounts using random templates`)

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
            useRandomTemplate: true, // Always use random template
            customizations: {} // No customizations, use template as-is
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

          {/* Random Template Info */}
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">
              🎲 <strong>Random Template Mode:</strong> A random template will be selected automatically from your custom templates for each campaign creation. 
              Each selected account will get a different template for variety!
            </AlertDescription>
          </Alert>

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
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No eligible accounts found. All client accounts already have campaigns or cannot be accessed.
                  </AlertDescription>
                </Alert>
                
                {/* Debug Information */}
                {debugInfo && (
                  <Card className="border-yellow-200 bg-yellow-50 mt-4">
                    <CardHeader>
                      <CardTitle className="text-yellow-800 text-sm">Debug Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="space-y-2">
                        <div className="text-yellow-700">
                          <strong>Summary:</strong> {debugInfo.summary.successCount} accounts checked successfully, 
                          {debugInfo.summary.errorCount} errors, {debugInfo.summary.eligibleCount} eligible
                        </div>
                        
                        {debugInfo.accountResults && debugInfo.accountResults.length > 0 && (
                          <div>
                            <strong className="text-yellow-700">Sample Account Results:</strong>
                            <div className="mt-2 space-y-1">
                              {debugInfo.accountResults.slice(0, 5).map((result: any, index: number) => (
                                <div key={index} className="text-xs bg-yellow-100 p-2 rounded">
                                  <span className="font-medium">{result.accountName}</span> ({result.accountId}): 
                                  <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                    {' '}{result.campaignCount >= 0 ? `${result.campaignCount} campaigns` : 'Error'}
                                  </span>
                                  {result.error && <span className="text-red-600"> - {result.error}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
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