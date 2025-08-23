import { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react'
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
  detectionReason?: string
}

interface ToBeDeletedAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  detectedAt: string
  detectionReason: string
  last30DaysCost: number
  yesterdayCost: number
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
  toBeDeletedAccounts: ToBeDeletedAccount[]
  summary: {
    totalSuspended: number
    suspended: number
    toBeDeleted: number
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
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set())

  const buildPreferencesLink = (customerId: string) => {
    const cleanCid = (customerId || '').replace(/[^0-9]/g, '')
    const cleanMcc = (mccId || '').replace(/[^0-9]/g, '')
    // Deep-link to the Preferences page for the specific customer.
    // Extra parameters seen in Google emails (euid, __u, uscid) are session-specific
    // and not required. ocid + __c reliably select the account context.
    const params = new URLSearchParams({ ocid: cleanCid, __c: cleanCid, authuser: '0' })
    if (cleanMcc) params.set('ascid', cleanMcc)
    return `https://ads.google.com/aw/preferences?${params.toString()}`
  }

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

  const handleToDeleteSelection = (accountId: string, selected: boolean) => {
    const newSelected = new Set(selectedToDelete)
    if (selected) {
      newSelected.add(accountId)
    } else {
      newSelected.delete(accountId)
    }
    setSelectedToDelete(newSelected)
  }

  const handleSelectAllToDelete = (selected: boolean) => {
    if (selected && data) {
      setSelectedToDelete(new Set(data.toBeDeletedAccounts.map(acc => acc.id)))
    } else {
      setSelectedToDelete(new Set())
    }
  }



  const getSuspensionDetails = (accountId: string): SuspensionDetails | undefined => {
    return data?.suspensionDetails.find(detail => detail.accountId === accountId)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUSPENDED':
        return 'destructive' as const
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
                Suspended Account IDs
              </CardTitle>
              <CardDescription>
                Newline-separated list for easy copy under MCC {mccId}
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

      {/* Simple copy list */}
      <Card>
        <CardHeader>
          <CardTitle>Suspended Account IDs</CardTitle>
        </CardHeader>
        <CardContent>
          {data.suspendedAccounts.length > 0 ? (
            <textarea
              className="w-full h-64 p-3 border rounded font-mono text-sm"
              readOnly
              value={data.suspendedAccounts.map(acc => acc.id).join('\n')}
            />
          ) : (
            <div className="text-sm text-gray-600">No suspended accounts found.</div>
          )}
        </CardContent>
      </Card>

      {/* To Be Deleted simple list (spend>200 last 30d; 0 spend last 2 days) */}
      <Card>
        <CardHeader>
          <CardTitle>To-Be-Deleted Account IDs</CardTitle>
          <CardDescription>Spent over 200 in last 30 days, zero spend yesterday and today</CardDescription>
        </CardHeader>
        <CardContent>
          {data.toBeDeletedAccounts.length > 0 ? (
            <textarea
              className="w-full h-48 p-3 border rounded font-mono text-sm"
              readOnly
              value={data.toBeDeletedAccounts.map(acc => acc.id).join('\n')}
            />
          ) : (
            <div className="text-sm text-gray-600">No accounts matched the to-be-deleted criteria.</div>
          )}
        </CardContent>
      </Card>

      {/* Keep summary minimal */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
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
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.summary.toBeDeleted}</div>
              <div className="text-sm text-gray-600">To Be Deleted</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Last detected: {new Date(data.summary.detectedAt).toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  )
}