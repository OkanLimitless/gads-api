import { useState, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AccountUnlinkManager from './AccountUnlinkManager'

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

interface AccountUnlinkManagerWrapperProps {
  mccId: string
  onBack?: () => void
  onUnlinkComplete?: (unlinkedAccounts: string[]) => void
}

export default function AccountUnlinkManagerWrapper({
  mccId,
  onBack,
  onUnlinkComplete
}: AccountUnlinkManagerWrapperProps) {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mccId) {
      fetchAllAccounts()
    }
  }, [mccId])

  const fetchAllAccounts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔍 Fetching ALL accounts for MCC: ${mccId}`)
      
      const response = await fetch(`/api/mcc-clients/all?mccId=${mccId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        console.log(`✅ Loaded ${data.accounts.length} accounts for unlink manager`)
        console.log(`📊 Account summary:`, data.summary)
        
        setAccounts(data.accounts)
      } else {
        console.error('❌ Failed to fetch all accounts:', data)
        setError(data.error || 'Failed to load accounts')
      }
    } catch (err) {
      console.error('💥 Error fetching all accounts:', err)
      setError('Failed to load accounts for management')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlinkComplete = (unlinkedAccounts: string[]) => {
    // Refresh the account list after unlinking
    fetchAllAccounts()
    
    // Notify parent component
    if (onUnlinkComplete) {
      onUnlinkComplete(unlinkedAccounts)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading all accounts for management...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {onBack && (
          <button 
            onClick={onBack} 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Client Selection
          </button>
        )}
      </div>
    )
  }

  return (
             <AccountUnlinkManager
           mccId={mccId}
           accounts={accounts}
           onBack={onBack}
           onUnlinkComplete={handleUnlinkComplete}
         />
  )
}