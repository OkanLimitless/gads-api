import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, Target, AlertCircle, CheckCircle, Building2, ArrowLeft } from 'lucide-react'
import CampaignCreationForm from './CampaignCreationForm'

interface ManualAccount {
  id: string
  name: string
  status: 'loading' | 'ready' | 'error' | 'campaign-deployed'
  error?: string
  hasRealCampaigns?: boolean
}

interface ManualAccountLoaderProps {
  onBack?: () => void
}

export default function ManualAccountLoader({ onBack }: ManualAccountLoaderProps) {
  const [accountIds, setAccountIds] = useState<string>('')
  const [accounts, setAccounts] = useState<ManualAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<ManualAccount | null>(null)
  const [showCampaignCreation, setShowCampaignCreation] = useState(false)
  const [autoMode, setAutoMode] = useState(false)

  const validateAndLoadAccounts = async () => {
    if (!accountIds.trim()) {
      setError('Please enter at least one account ID')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Parse account IDs (comma-separated, one per line, or space-separated)
      const ids = accountIds
        .split(/[,\n\s]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .filter(id => /^\d+$/.test(id)) // Only numeric IDs

      if (ids.length === 0) {
        setError('No valid account IDs found. Please enter numeric account IDs.')
        setIsLoading(false)
        return
      }

      console.log(`🔍 Loading ${ids.length} manual account IDs:`, ids)

      // Initialize accounts with loading state
      const initialAccounts: ManualAccount[] = ids.map(id => ({
        id,
        name: `Account ${id}`,
        status: 'loading'
      }))
      setAccounts(initialAccounts)

      // Validate each account and check for existing campaigns
      const response = await fetch('/api/accounts/manual-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: ids })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAccounts(data.accounts)
        console.log(`✅ Loaded ${data.accounts.length} manual accounts`)
      } else {
        setError(data.error || 'Failed to load accounts')
        setAccounts([])
      }
    } catch (err) {
      console.error('💥 Error loading manual accounts:', err)
      setError('Failed to load accounts. Please try again.')
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCampaignSuccess = (campaignData: any) => {
    if (selectedAccount) {
      // Mark account as having campaign deployed
      setAccounts(prev => prev.map(acc => 
        acc.id === selectedAccount.id 
          ? { ...acc, status: 'campaign-deployed' as const }
          : acc
      ))
      
      // Close campaign creation form
      setShowCampaignCreation(false)
      setSelectedAccount(null)
    }
  }

  const handleCampaignError = (error: string) => {
    console.error('Campaign creation error:', error)
  }

  const readyAccounts = accounts.filter(acc => acc.status === 'ready')
  const deployedAccounts = accounts.filter(acc => acc.status === 'campaign-deployed')

  if (showCampaignCreation && selectedAccount) {
    return (
      <CampaignCreationForm
        selectedAccount={{
          id: selectedAccount.id,
          name: selectedAccount.name,
          currency: 'EUR', // Default currency
          timeZone: 'Europe/Amsterdam', // Default timezone
          status: 'ENABLED'
        }}
        mode={autoMode ? 'auto-url-swap' : 'standard'}
        onSuccess={handleCampaignSuccess}
        onError={handleCampaignError}
        onBack={() => {
          setShowCampaignCreation(false)
          setSelectedAccount(null)
          setAutoMode(false)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Manual Deployment Mode */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">🛠️ Manual Deployment Mode</AlertTitle>
        <AlertDescription className="text-blue-700">
          <strong>Enhanced Mode Active:</strong> All accessible accounts can be used for campaign creation, 
          even those with existing campaigns. Perfect for manual campaign deployment and testing.
          <br />
          <em className="text-sm">This gives you full flexibility to deploy campaigns to any accessible account.</em>
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Account Loader</h1>
          <p className="text-gray-600 mt-1">
            Load specific account IDs to deploy campaigns manually
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Account ID Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Account IDs
          </CardTitle>
          <CardDescription>
            Enter account IDs that you want to deploy campaigns to. These should be accounts under the same MCC that already have dummy campaigns ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accountIds">Account IDs</Label>
            <Textarea
              id="accountIds"
              placeholder="Enter account IDs (one per line, comma-separated, or space-separated)&#10;Example:&#10;1234567890&#10;2345678901&#10;3456789012"
              value={accountIds}
              onChange={(e) => setAccountIds(e.target.value)}
              rows={6}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter numeric account IDs only. Multiple formats supported: one per line, comma-separated, or space-separated.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={validateAndLoadAccounts}
            disabled={isLoading || !accountIds.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading Accounts...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Load & Validate Accounts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loaded Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Loaded Accounts ({accounts.length})
            </CardTitle>
            <CardDescription>
              Accounts ready for campaign deployment. Accounts will disappear once campaigns are deployed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 border rounded-lg ${
                    account.status === 'ready' 
                      ? 'border-green-200 bg-green-50' 
                      : account.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : account.status === 'campaign-deployed'
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-sm text-gray-500">ID: {account.id}</p>
                        {account.error && (
                          <p className="text-sm text-red-600 mt-1">{account.error}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {account.status === 'loading' && (
                        <Badge variant="secondary">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Loading
                        </Badge>
                      )}
                      
                      {account.status === 'ready' && (
                        <>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(account)
                              setAutoMode(false)
                              setShowCampaignCreation(true)
                            }}
                          >
                            Deploy Campaign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAccount(account)
                              setAutoMode(true)
                              setShowCampaignCreation(true)
                            }}
                          >
                            Deploy (Auto URL Swap)
                          </Button>
                        </>
                      )}
                      
                      {account.status === 'error' && (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      
                      {account.status === 'campaign-deployed' && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Campaign Deployed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{readyAccounts.length}</p>
                  <p className="text-sm text-gray-600">Ready for Campaigns</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{deployedAccounts.length}</p>
                  <p className="text-sm text-gray-600">Campaigns Deployed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
                  <p className="text-sm text-gray-600">Total Accounts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <p>Enter the account IDs you want to deploy campaigns to (accounts that already have dummy campaigns)</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <p>Click "Load & Validate Accounts" to check account status and existing campaigns</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <p>Deploy campaigns on ready accounts - they will disappear from the list once deployed</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
            <p>Accounts with existing real campaigns will be marked as "Campaign Deployed" and cannot be used again</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}