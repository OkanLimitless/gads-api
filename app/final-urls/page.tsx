'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowLeft, Target, Link2, Globe, Download, Copy } from 'lucide-react'

interface CampaignFinalUrlInfo {
  accountId: string
  accountName: string
  campaignId: string
  campaignName: string
  budgetMicros: number
  budgetEuros: number
  finalUrls: string[]
}

export default function FinalUrlsPage() {
  const { status } = useSession()
  const [minBudget, setMinBudget] = useState<number>(20)
  const [mccId, setMccId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [results, setResults] = useState<CampaignFinalUrlInfo[]>([])
  const [exporting, setExporting] = useState(false)

  const fetchFinalUrls = async () => {
    setIsLoading(true)
    setError('')
    setResults([])
    try {
      const params = new URLSearchParams()
      if (minBudget) params.set('minBudgetEuros', String(minBudget))
      if (mccId.trim()) params.set('mccId', mccId.trim())
      const res = await fetch(`/api/campaigns/final-urls?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch final URLs')
      }
      setResults(data.campaigns || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Final URL Explorer
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status !== 'authenticated' && (
                <Button variant="outline" size="sm">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Fetch Final URLs
              </CardTitle>
              <CardDescription>Exclude €3 dummy campaigns and include only campaigns with budget ≥ min budget.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Minimum Budget (€)</label>
                  <Input type="number" min={1} step={1} value={minBudget} onChange={(e) => setMinBudget(parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-gray-500 mt-1">Defaults to €20. Always excludes ≤ €3.</p>
                </div>
                <div>
                  <label className="text-sm font-medium">MCC ID (optional)</label>
                  <Input value={mccId} onChange={(e) => setMccId(e.target.value)} placeholder="e.g., 1234567890" />
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchFinalUrls} disabled={isLoading} className="w-full">
                    {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching...</>) : (<><Target className="h-4 w-4 mr-2" /> Fetch Final URLs</>)}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-600">{error}</div>
              )}

              {results.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">{results.length} campaigns found</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const allUrls = new Set<string>()
                        results.forEach(r => (r.finalUrls || []).forEach(u => u && allUrls.add(u)))
                        navigator.clipboard.writeText(Array.from(allUrls).join('\n'))
                      }}>
                        <Copy className="h-4 w-4 mr-2" /> Copy All URLs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        try {
                          setExporting(true)
                          const rows: string[] = []
                          rows.push(['Account Name','Account ID','Campaign Name','Campaign ID','Budget (€)','Final URL'].join(','))
                          results.forEach(item => {
                            const urls = item.finalUrls && item.finalUrls.length ? item.finalUrls : ['']
                            urls.forEach(url => {
                              rows.push([
                                `"${item.accountName.replaceAll('"','""')}"`,
                                item.accountId,
                                `"${item.campaignName.replaceAll('"','""')}"`,
                                item.campaignId,
                                item.budgetEuros.toFixed(2),
                                `"${(url || '').replaceAll('"','""')}"`,
                              ].join(','))
                            })
                          })
                          const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `final-urls-export.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        } finally {
                          setExporting(false)
                        }
                      }} disabled={exporting}>
                        <Download className="h-4 w-4 mr-2" /> {exporting ? 'Exporting...' : 'Export CSV'}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-auto border rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-2">Account</th>
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-left p-2">Budget (€)</th>
                          <th className="text-left p-2">Final URLs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((item) => (
                          <tr key={`${item.accountId}-${item.campaignId}`} className="border-t">
                            <td className="p-2 whitespace-nowrap">{item.accountName} <span className="text-gray-500">({item.accountId})</span></td>
                            <td className="p-2 whitespace-nowrap">{item.campaignName} <span className="text-gray-500">({item.campaignId})</span></td>
                            <td className="p-2">{item.budgetEuros.toFixed(2)}</td>
                            <td className="p-2">
                              <div className="space-y-1">
                                {item.finalUrls.length ? item.finalUrls.map(url => (
                                  <div key={url} className="break-all text-blue-700">{url}</div>
                                )) : (
                                  <span className="text-gray-500">No URLs</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

