'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateAccountPage() {
  const [mccId, setMccId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ customerId: string; preferencesUrl: string } | null>(null)

  const onCreate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mccId }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account')
      }
      setResult({ customerId: data.customerId, preferencesUrl: data.preferencesUrl })
    } catch (e: any) {
      setError(e?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Account (API)</CardTitle>
          <CardDescription>
            Creates a new client account under the specified MCC with currency EUR and time zone Europe/Amsterdam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">MCC ID (Manager Customer ID)</label>
              <Input
                placeholder="e.g. 123-456-7890 or 1234567890"
                value={mccId}
                onChange={(e) => setMccId(e.target.value)}
              />
            </div>
            <Button onClick={onCreate} disabled={loading || !mccId.trim()}>
              {loading ? 'Creating…' : 'Create Account'}
            </Button>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            {result && (
              <div className="mt-4 space-y-2">
                <div className="text-sm">New Customer ID: <span className="font-mono">{result.customerId}</span></div>
                <a
                  href={result.preferencesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Open Preferences to add billing
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}