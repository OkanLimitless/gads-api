'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [authDebug, setAuthDebug] = useState<any>(null)
  const [accountsData, setAccountsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchAuthDebug = async () => {
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()
      setAuthDebug(data)
    } catch (error) {
      console.error('Failed to fetch auth debug:', error)
    }
  }

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/accounts')
      const data = await response.json()
      setAccountsData(data)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      setAccountsData({ error: 'Failed to fetch accounts' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Debug Page</h1>
      
      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          {session && (
            <div>
              <strong>User:</strong> {session.user?.name} ({session.user?.email})
            </div>
          )}
          
          <div className="flex gap-2">
            {status === 'authenticated' ? (
              <Button onClick={() => signOut()}>Sign Out</Button>
            ) : (
              <Button onClick={() => signIn('google')}>Sign In with Google</Button>
            )}
            <Button onClick={fetchAuthDebug} variant="outline">
              Get Auth Debug Info
            </Button>
          </div>

          {authDebug && (
            <div className="mt-4">
              <h3 className="font-semibold">Auth Debug Info:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(authDebug, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Google Ads Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={fetchAccounts} 
            disabled={loading || status !== 'authenticated'}
          >
            {loading ? 'Loading...' : 'Fetch Accounts'}
          </Button>

          {accountsData && (
            <div className="mt-4">
              <h3 className="font-semibold">Accounts Data:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(accountsData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}