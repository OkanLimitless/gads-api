'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'

interface SpendRow {
  accountId: string
  accountName: string
  spend: number
}

export default function SpendExplorerPage() {
  const [mccId, setMccId] = useState('1284928552')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [rows, setRows] = useState<SpendRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSpend = async () => {
    setLoading(true)
    setError(null)
    setRows([])
    try {
      const params = new URLSearchParams({ mccId })
      if (start) params.set('start', start)
      if (end) params.set('end', end)
      if (min) params.set('min', min)
      if (max) params.set('max', max)
      const res = await fetch(`/api/mcc-clients/spend?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to fetch spend')
      }
      const items = Array.isArray(data.accounts) ? data.accounts : []
      setRows(items.map((r: any) => ({
        accountId: String(r.accountId || ''),
        accountName: String(r.accountName || ''),
        spend: Number(r.spend || 0),
      })))
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch spend')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Spend Explorer</h1>
            <p className="text-gray-600 mt-1">List ENABLED accounts under an MCC with total spend in a range.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Defaults to the last 30 days and spend between €1 and €100.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium mb-1">MCC ID</label>
                <Input value={mccId} onChange={e => setMccId(e.target.value)} placeholder="1284928552" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start (YYYY-MM-DD)</label>
                <Input value={start} onChange={e => setStart(e.target.value)} placeholder="(optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End (YYYY-MM-DD)</label>
                <Input value={end} onChange={e => setEnd(e.target.value)} placeholder="(optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min (€)</label>
                <Input type="number" min={0} value={min} onChange={e => setMin(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max (€)</label>
                <Input type="number" min={0} value={max} onChange={e => setMax(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={fetchSpend} disabled={loading}>
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</>) : 'Fetch Spend'}
              </Button>
              {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{rows.length} account(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-sm text-gray-600">No results. Adjust filters and click Fetch Spend.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Account ID</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Spend (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.accountId}>
                        <TableCell className="font-mono text-xs">{r.accountId}</TableCell>
                        <TableCell className="truncate max-w-[420px]">{r.accountName}</TableCell>
                        <TableCell className="text-right">{r.spend.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

