'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CreateAccountPage() {
  const [count, setCount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ customerIds: string[] } | null>(null)

  const onCreate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch('/api/accounts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: Number(count) }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account(s)')
      }
      setResult({ customerIds: data.customerIds })
    } catch (e: any) {
      setError(e?.message || 'Failed to create account(s)')
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
            Creates client account(s) under MCC 1284928552 with currency EUR and time zone Europe/Amsterdam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">How many accounts?</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">Max 20 per request</div>
            </div>
            <Button onClick={onCreate} disabled={loading || Number(count) < 1}>
              {loading ? 'Creating…' : 'Create'}
            </Button>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            {result && result.customerIds?.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Created Customer IDs:</div>
                <ul className="list-disc list-inside text-sm">
                  {result.customerIds.map((id) => (
                    <li key={id}><span className="font-mono">{id}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}