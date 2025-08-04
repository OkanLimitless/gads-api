import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Unlink, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Users,
  Building2,
  Trash2
} from 'lucide-react'

interface AdAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  canManageCampaigns: boolean
  testAccount: boolean
  isManager: boolean
  managerCustomerId?: string
  level: number
  accountType: 'MCC' | 'CLIENT' | 'UNKNOWN'
  isSuspended?: boolean
  totalCampaigns?: number
  spendLast30Days?: number
  lastActivity?: string
}

interface AccountUnlinkManagerProps {
  mccId: string
  mccName?: string
  accounts: AdAccount[]
  onBack?: () => void
  onUnlinkComplete?: (unlinkedAccounts: string[]) => void
}

interface UnlinkResult {
  accountId: string
  status: 'success' | 'error'
  message: string
}

export default function AccountUnlinkManager({ 
  mccId, 
  mccName, 
  accounts, 
  onBack, 
  onUnlinkComplete 
}: AccountUnlinkManagerProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [unlinkResults, setUnlinkResults] = useState<UnlinkResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'suspended' | 'enabled'>('all')

  const handleAccountToggle = (accountId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId)
    } else {
      newSelected.add(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set())
    } else {
      setSelectedAccounts(new Set(accounts.map(account => account.id)))
    }
  }

  const handleUnlinkAccounts = async () => {
    if (selectedAccounts.size === 0) return

    setIsUnlinking(true)
    setError(null)
    setSuccess(null)
    setUnlinkResults([])

    try {
      console.log(`🔓 Unlinking ${selectedAccounts.size} accounts from MCC ${mccId}`)
      
      const response = await fetch('/api/mcc-clients/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mccId,
          accountIds: Array.from(selectedAccounts)
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setUnlinkResults(data.results)
        setSelectedAccounts(new Set())
        setShowConfirmation(false)
        
        // Notify parent component
        const successfulUnlinks = data.results
          .filter((r: UnlinkResult) => r.status === 'success')
          .map((r: UnlinkResult) => r.accountId)
        
        if (onUnlinkComplete) {
          onUnlinkComplete(successfulUnlinks)
        }
      } else {
        setError(data.error || 'Failed to unlink accounts')
        setUnlinkResults(data.results || [])
      }
    } catch (err) {
      console.error('💥 Error unlinking accounts:', err)
      setError('Failed to unlink accounts from MCC')
    } finally {
      setIsUnlinking(false)
    }
  }

  const getFilteredAccounts = () => {
    switch (filterStatus) {
      case 'suspended':
        return accounts.filter(account => account.isSuspended)
      case 'enabled':
        return accounts.filter(account => account.status === 'ENABLED')
      default:
        return accounts
    }
  }

  const getSelectedAccountsInfo = () => {
    return accounts.filter(account => selectedAccounts.has(account.id))
  }

  const filteredAccounts = getFilteredAccounts()
  const selectedAccountsInfo = getSelectedAccountsInfo()
  const suspendedAccounts = accounts.filter(account => account.isSuspended)

  const handleSelectAllSuspended = () => {
    const suspendedIds = suspendedAccounts.map(account => account.id)
    setSelectedAccounts(new Set(suspendedIds))
  }

  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Confirm Account Unlinking</h2>
            <p className="text-gray-600 mt-1">
              Review the accounts you're about to unlink from MCC {mccId}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            disabled={isUnlinking}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Unlinking accounts will remove them from this MCC's management. 
            This action cannot be undone and you'll lose access to manage these accounts unless you re-link them.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Unlink className="h-5 w-5 mr-2 text-red-600" />
              Accounts to Unlink ({selectedAccountsInfo.length})
            </CardTitle>
            <CardDescription>
              These accounts will be removed from MCC management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedAccountsInfo.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-gray-500">
                      ID: {account.id} • {account.currency} • {account.status}
                    </div>
                    {account.totalCampaigns !== undefined && (
                      <div className="text-xs text-gray-400">
                        {account.totalCampaigns} campaigns
                      </div>
                    )}
                  </div>
                  <Badge variant="destructive">Will be unlinked</Badge>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleUnlinkAccounts}
                disabled={isUnlinking}
                variant="destructive"
                className="flex-1"
              >
                {isUnlinking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Unlinking Accounts...
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-2" />
                    Confirm Unlink {selectedAccountsInfo.length} Accounts
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                disabled={isUnlinking}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Unlink Accounts from MCC</h2>
          <p className="text-gray-600 mt-1">
            Select accounts to remove from MCC {mccId} {mccName && `(${mccName})`}
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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

      {/* Unlink Results */}
      {unlinkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unlink Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unlinkResults.map((result) => (
                <div key={result.accountId} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">Account {result.accountId}</span>
                    <div className="text-sm text-gray-600">{result.message}</div>
                  </div>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status === 'success' ? 'Unlinked' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Select Accounts to Unlink
              </CardTitle>
              <CardDescription>
                Choose which accounts to remove from this MCC's management
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedAccounts.size === filteredAccounts.length && filteredAccounts.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
                              <label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({filteredAccounts.length})
                </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              All Accounts ({accounts.length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'suspended' ? 'destructive' : 'outline'}
              onClick={() => setFilterStatus('suspended')}
            >
              ⚠️ Suspended ({suspendedAccounts.length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'enabled' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('enabled')}
            >
              ✅ Enabled ({accounts.filter(a => a.status === 'ENABLED').length})
            </Button>
            {suspendedAccounts.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleSelectAllSuspended}
                className="ml-auto"
              >
                Select All Suspended
              </Button>
            )}
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No client accounts found for this MCC</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 ${
                    account.isSuspended ? 'border-red-300 bg-red-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`account-${account.id}`}
                    checked={selectedAccounts.has(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <label 
                          htmlFor={`account-${account.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {account.name}
                        </label>
                        <div className="text-sm text-gray-500">
                          ID: {account.id} • {account.currency} • {account.timeZone}
                        </div>
                        {account.totalCampaigns !== undefined && (
                          <div className="text-xs text-gray-400">
                            {account.totalCampaigns} campaigns
                            {account.spendLast30Days && ` • $${account.spendLast30Days.toLocaleString()} spent (30d)`}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {account.isSuspended && (
                          <Badge variant="destructive">
                            ⚠️ SUSPENDED
                          </Badge>
                        )}
                        <Badge variant={account.status === 'ENABLED' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                        {account.testAccount && (
                          <Badge variant="outline">
                            TEST
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {selectedAccounts.size > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900">
                  {selectedAccounts.size} account{selectedAccounts.size !== 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-red-700">
                  These accounts will be removed from MCC management
                </p>
              </div>
              <Button
                onClick={() => setShowConfirmation(true)}
                variant="destructive"
                disabled={selectedAccounts.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Unlink {selectedAccounts.size} Account{selectedAccounts.size !== 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}