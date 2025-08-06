import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SuspendedAccount {
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
  isSuspended: boolean
  suspensionReason: string
  detectedAt: string
}

interface SuspensionDetails {
  accountId: string
  optimizationScore?: number
  eligibilityFailures?: string[]
  error?: string
}

interface SuspendedAccountsResponse {
  success: boolean
  suspendedAccounts: SuspendedAccount[]
  suspensionDetails: SuspensionDetails[]
  summary: {
    totalSuspended: number
    suspended: number
    canceled: number
    detectedAt: string
  }
  mccId: string
  recommendation: string
}

interface SuspendedAccountsDetectorProps {
  mccId: string
  onBack?: () => void
}

export default function SuspendedAccountsDetector({
  mccId,
  onBack
}: SuspendedAccountsDetectorProps) {
  const [data, setData] = useState<SuspendedAccountsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (mccId) {
      detectSuspendedAccounts()
    }
  }, [mccId])

  const detectSuspendedAccounts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔍 Detecting suspended accounts for MCC: ${mccId}`)
      const response = await fetch(`/api/mcc-clients/suspended?mccId=${mccId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Suspended accounts detection result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to detect suspended accounts')
      }

      setData(result)
    } catch (err) {
      console.error('❌ Error detecting suspended accounts:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccountSelection = (accountId: string, selected: boolean) => {
    const newSelected = new Set(selectedAccounts)
    if (selected) {
      newSelected.add(accountId)
    } else {
      newSelected.delete(accountId)
    }
    setSelectedAccounts(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected && data) {
      setSelectedAccounts(new Set(data.suspendedAccounts.map(acc => acc.id)))
    } else {
      setSelectedAccounts(new Set())
    }
  }



  const getSuspensionDetails = (accountId: string): SuspensionDetails | undefined => {
    return data?.suspensionDetails.find(detail => detail.accountId === accountId)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUSPENDED':
        return 'destructive' as const
      case 'CANCELED':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Detecting suspended accounts...</p>
            <p className="text-sm text-gray-500 mt-2">Scanning MCC {mccId} for suspended client accounts</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error detecting suspended accounts:</strong> {error}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4 mt-6">
            <Button onClick={detectSuspendedAccounts} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Detection
            </Button>
            {onBack && (
              <Button onClick={onBack} variant="ghost">
                ← Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Suspended Account Detection
              </CardTitle>
              <CardDescription>
                Detect and manage suspended client accounts under MCC {mccId}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={detectSuspendedAccounts} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {onBack && (
                <Button onClick={onBack} variant="ghost" size="sm">
                  ← Back
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.summary.totalSuspended}</div>
              <div className="text-sm text-gray-600">Total Suspended</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{data.summary.suspended}</div>
              <div className="text-sm text-gray-600">Suspended Status</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{data.summary.canceled}</div>
              <div className="text-sm text-gray-600">Canceled Status</div>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> {data.recommendation}
            </AlertDescription>
          </Alert>

          <p className="text-sm text-gray-500 mt-2">
            Last detected: {new Date(data.summary.detectedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Suspended Accounts Table */}
      {data.suspendedAccounts.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Suspended Client Accounts</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSelectAll(selectedAccounts.size !== data.suspendedAccounts.length)}
                  variant="outline"
                  size="sm"
                >
                  {selectedAccounts.size === data.suspendedAccounts.length ? 'Deselect All' : 'Select All'}
                </Button>

              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Time Zone</TableHead>
                  <TableHead>Test Account</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.suspendedAccounts.map((account) => {
                  const details = getSuspensionDetails(account.id)
                  const isSelected = selectedAccounts.has(account.id)

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleAccountSelection(account.id, e.target.checked)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="font-mono text-sm">{account.id}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(account.status)}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>{account.timeZone}</TableCell>
                      <TableCell>
                        {account.testAccount ? (
                          <Badge variant="outline">Test</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {details?.error ? (
                          <span className="text-xs text-red-600">Access limited</span>
                        ) : details?.optimizationScore ? (
                          <span className="text-xs">Opt: {details.optimizationScore}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => window.open(`https://ads.google.com/aw/accounts?ocid=${account.id}`, '_blank')}
                          variant="ghost"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-900 mb-2">No Suspended Accounts Found</h3>
            <p className="text-green-700">
              Great! Your MCC {mccId} doesn't have any suspended or canceled client accounts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}