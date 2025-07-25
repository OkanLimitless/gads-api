'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Link2, LogOut, Building2, Users, Target, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [allAccounts, setAllAccounts] = useState<AdAccount[]>([])
  const [selectedMCC, setSelectedMCC] = useState<string>('')
  const [clientAccounts, setClientAccounts] = useState<AdAccount[]>([])
  const [selectedClientAccount, setSelectedClientAccount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'mcc-selection' | 'client-selection' | 'campaign-creation'>('mcc-selection')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllAccounts()
    }
  }, [status])

  const fetchAllAccounts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/accounts')
      const data = await response.json()
      
      if (response.ok && data.accounts) {
        setAllAccounts(data.accounts)
        console.log('📋 Fetched accounts:', data.accounts)
      } else {
        setError(data.error || 'Failed to fetch accounts')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleMCCSelection = async (mccId: string) => {
    setSelectedMCC(mccId)
    setLoading(true)
    setError('')
    
    try {
      // Filter client accounts that belong to this MCC
      const clients = allAccounts.filter(account => 
        account.managerCustomerId === mccId && account.canManageCampaigns
      )
      
      // If no direct clients found, show all non-MCC accounts as potential clients
      if (clients.length === 0) {
        const allClients = allAccounts.filter(account => account.canManageCampaigns)
        setClientAccounts(allClients)
      } else {
        setClientAccounts(clients)
      }
      
      setStep('client-selection')
    } catch (error) {
      setError('Failed to load client accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleClientSelection = (clientId: string) => {
    setSelectedClientAccount(clientId)
    setStep('campaign-creation')
  }

  const handleBack = () => {
    if (step === 'client-selection') {
      setStep('mcc-selection')
      setSelectedMCC('')
      setClientAccounts([])
    } else if (step === 'campaign-creation') {
      setStep('client-selection')
      setSelectedClientAccount('')
    }
  }

  const handleSignIn = () => signIn('google')
  const handleSignOut = () => signOut()

  // Get MCC accounts
  const mccAccounts = allAccounts.filter(account => account.isManager)
  const selectedMCCAccount = allAccounts.find(account => account.id === selectedMCC)
  const selectedClient = allAccounts.find(account => account.id === selectedClientAccount)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AdGenius Pro
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status === 'authenticated' ? (
                <>
                  <span className="text-sm text-gray-600">
                    {session?.user?.name}
                  </span>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={handleSignIn} variant="outline" size="sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Google Ads
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex-1 space-y-6 p-8 pt-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className={step === 'mcc-selection' ? 'font-medium text-blue-600' : ''}>
              Select MCC Account
            </span>
            {step !== 'mcc-selection' && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className={step === 'client-selection' ? 'font-medium text-blue-600' : ''}>
                  Select Client Account
                </span>
              </>
            )}
            {step === 'campaign-creation' && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-blue-600">Create Campaign</span>
              </>
            )}
          </div>

          {/* Back Button */}
          {step !== 'mcc-selection' && (
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          {/* Authentication Required */}
          {status !== 'authenticated' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 text-center">
                <Link2 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Connect Your Google Ads Account
                </h3>
                <p className="text-blue-700 mb-4">
                  Sign in with Google to access your MCC accounts and create campaigns.
                </p>
                <Button onClick={handleSignIn}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Google Ads
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start text-red-800">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <div className="font-semibold">Error</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: MCC Account Selection */}
          {status === 'authenticated' && step === 'mcc-selection' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Select MCC (Manager) Account
                </CardTitle>
                <CardDescription>
                  Choose the Manager Customer Center account that contains your client accounts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading MCC accounts...</span>
                  </div>
                ) : mccAccounts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mccAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 border rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        onClick={() => handleMCCSelection(account.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{account.name}</div>
                          <div className="flex items-center space-x-1">
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              MCC
                            </span>
                            {account.testAccount && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                Test
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {account.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Currency: {account.currency} • Timezone: {account.timeZone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No MCC accounts found.</p>
                    <p className="text-sm mt-1">
                      Make sure your Google account has access to Manager Customer Center accounts.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Client Account Selection */}
          {step === 'client-selection' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Select Client Account
                </CardTitle>
                <CardDescription>
                  Choose the client account where you want to create campaigns.
                  {selectedMCCAccount && (
                    <span className="block mt-1 text-blue-600">
                      Under MCC: {selectedMCCAccount.name}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading client accounts...</span>
                  </div>
                ) : clientAccounts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clientAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-4 border rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
                        onClick={() => handleClientSelection(account.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{account.name}</div>
                          <div className="flex items-center space-x-1">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              CLIENT
                            </span>
                            {account.testAccount && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                Test
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {account.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          Currency: {account.currency} • Timezone: {account.timeZone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No client accounts found under this MCC.</p>
                    <p className="text-sm mt-1">
                      This MCC might not have any client accounts linked to it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Campaign Creation */}
          {step === 'campaign-creation' && selectedClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Create Campaign
                </CardTitle>
                <CardDescription>
                  Create a new campaign for: <strong>{selectedClient.name}</strong>
                  <span className="block mt-1 text-sm text-gray-500">
                    Account ID: {selectedClient.id}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Campaign Creation Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Campaign creation interface will be implemented here.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg text-left">
                    <h4 className="font-medium text-blue-900 mb-2">Selected Account Details:</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div><strong>Name:</strong> {selectedClient.name}</div>
                      <div><strong>ID:</strong> {selectedClient.id}</div>
                      <div><strong>Currency:</strong> {selectedClient.currency}</div>
                      <div><strong>Timezone:</strong> {selectedClient.timeZone}</div>
                      <div><strong>Status:</strong> {selectedClient.status}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}