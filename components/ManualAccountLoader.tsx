import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Target, AlertCircle, CheckCircle, Building2, ArrowLeft, Phone } from 'lucide-react'
import CampaignCreationForm from './CampaignCreationForm'
import dynamic from 'next/dynamic'

const CallOnlyCampaignForm = dynamic(() => import('./CallOnlyCampaignForm'), { ssr: false })

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
  const [callOnlyMode, setCallOnlyMode] = useState(false)

  // Bulk deploy settings (mirror of BulkDeployWizard)
  const [templates, setTemplates] = useState<Array<{ _id: string; name: string; data: any }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [deviceTargeting, setDeviceTargeting] = useState<'ALL' | 'MOBILE_ONLY'>('ALL')
  const [adScheduleTemplateId, setAdScheduleTemplateId] = useState<string>('')
  const [count, setCount] = useState<string>('1')
  const [finalUrls, setFinalUrls] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ customerId: string; success: boolean; campaignId?: string; error?: string }> | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/campaign-templates')
        const data = await res.json()
        if (res.ok && data.success) {
          setTemplates(data.templates || [])
        }
      } catch {}
    }
    fetchTemplates()
  }, [])

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

  // Bulk deploy helpers
  const parsedUrls = finalUrls.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const n = Math.max(0, Math.min(20, Number(count) || 0))
  const selectedList = Array.from(selectedIds)
  const canSubmit = selectedTemplateId && n >= 1 && parsedUrls.length === n && readyAccounts.length >= n && (selectedIds.size === 0 || selectedIds.size === n)

  const autoSelectFirstN = () => {
    const next = new Set<string>()
    for (let i = 0; i < Math.min(n, readyAccounts.length); i++) next.add(readyAccounts[i].id)
    setSelectedIds(next)
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const onBulkSubmit = async () => {
    setSubmitting(true)
    setBulkError(null)
    setResults([])

    try {
      let targets: string[] = selectedList
      if (targets.length === 0) {
        targets = readyAccounts.slice(0, n).map(a => a.id)
      }
      const items = targets.map((customerId, idx) => ({ customerId, finalUrl: parsedUrls[idx] }))
      const chunkSize = 3
      const aggregate: Array<{ customerId: string; success: boolean; campaignId?: string; error?: string }> = []
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)
        const res = await fetch('/api/campaigns/bulk-deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            overrides: {
              deviceTargeting,
              adScheduleTemplateId: adScheduleTemplateId === 'default' ? undefined : adScheduleTemplateId,
            },
            items: chunk,
          })
        })
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const payload = isJson ? await res.json() : { error: await res.text() }
        if (!res.ok || !payload.success) {
          const errMsg = typeof payload.error === 'string' ? payload.error : JSON.stringify(payload.error || payload)
          throw new Error(errMsg || 'Bulk deploy failed')
        }
        const partial = Array.isArray(payload.results) ? payload.results : []
        aggregate.push(...partial)
        setResults([...aggregate])
      }
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : JSON.stringify(e)
      setBulkError(msg || 'Bulk deploy failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (showCampaignCreation && selectedAccount && callOnlyMode) {
    return (
      <CallOnlyCampaignForm
        selectedAccount={{
          id: selectedAccount.id,
          name: selectedAccount.name,
          currency: 'EUR',
          timeZone: 'Europe/Amsterdam',
          status: 'ENABLED'
        }}
        onSuccess={handleCampaignSuccess}
        onError={handleCampaignError}
        onBack={() => {
          setShowCampaignCreation(false)
          setSelectedAccount(null)
          setAutoMode(false)
          setCallOnlyMode(false)
        }}
      />
    )
  }

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
          setCallOnlyMode(false)
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
                              setCallOnlyMode(false)
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
                              setCallOnlyMode(false)
                              setShowCampaignCreation(true)
                            }}
                          >
                            Deploy (Auto URL Swap)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAccount(account)
                              setAutoMode(false)
                              setCallOnlyMode(true)
                              setShowCampaignCreation(true)
                            }}
                          >
                            <Phone className="h-4 w-4 mr-1" /> Call-Only
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

      {/* Bulk Deployment to Loaded Accounts */}
      {readyAccounts.length > 0 && !results && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Deploy to Loaded Accounts</CardTitle>
            <CardDescription>Pick a template and apply settings, then deploy to N ready accounts with N unique final URLs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Device Targeting</label>
                  <Select value={deviceTargeting} onValueChange={(v: any) => setDeviceTargeting(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Devices</SelectItem>
                      <SelectItem value="MOBILE_ONLY">Mobile Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ad Schedule Template</label>
                  <Select value={adScheduleTemplateId} onValueChange={(v: any) => setAdScheduleTemplateId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Use template default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use template default</SelectItem>
                      <SelectItem value="est_business_hours">EST Business Hours</SelectItem>
                      <SelectItem value="amsterdam_evening_rush">Amsterdam Evening Rush</SelectItem>
                      <SelectItem value="energie">Energie (10:00-20:30 Mon-Fri)</SelectItem>
                      <SelectItem value="nine_to_five">9-5 Business Hours (Mon-Fri)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">How many campaigns/accounts?</label>
                  <Input type="number" min={1} max={20} value={count} onChange={e => setCount(e.target.value)} />
                  <div className="text-xs text-gray-500 mt-1">Max 20 per batch</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Final URLs (one per line, exactly N)</label>
                  <Textarea value={finalUrls} onChange={e => setFinalUrls(e.target.value)} rows={6} />
                  <div className="text-xs text-gray-500 mt-1">Count: {parsedUrls.length} / N: {n}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Pick N ready accounts (optional)</label>
                  <Button variant="outline" size="sm" onClick={autoSelectFirstN}>Auto-select first {n}</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-auto p-2 border rounded">
                  {readyAccounts.map(acc => (
                    <label key={acc.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.has(acc.id)} onChange={() => toggleSelect(acc.id)} />
                      <span className="font-mono text-xs">{acc.id}</span>
                      <span className="text-xs text-gray-600 truncate">{acc.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {bulkError && <div className="text-sm text-red-600">{bulkError}</div>}

              <div className="flex gap-2">
                <Button onClick={onBulkSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deploying…</>) : 'Start Bulk Deploy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk results */}
      {results && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Deployment Results</CardTitle>
            <CardDescription>{results.filter(r => r.success).length} succeeded, {results.filter(r => !r.success).length} failed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {results.map((r, i) => (
                <div key={i} className={`p-2 rounded border ${r.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="font-mono">{r.customerId}</div>
                  {r.success ? (
                    <div className="text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> campaignId: {r.campaignId}</div>
                  ) : (
                    <div className="text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {r.error || 'failed'}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => { setResults(null) }}>Back to Form</Button>
              {onBack && <Button variant="outline" onClick={onBack}>Exit</Button>}
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