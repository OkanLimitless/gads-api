import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface ReadyAccount {
  id: string
  name: string
  testAccount?: boolean
}

interface TemplateItem {
  _id: string
  name: string
  description?: string
  category?: string
  data: any
}

interface BulkDeployWizardProps {
  readyAccounts: ReadyAccount[]
  onBack: () => void
}

export default function BulkDeployWizard({ readyAccounts, onBack }: BulkDeployWizardProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [deviceTargeting, setDeviceTargeting] = useState<'ALL' | 'MOBILE_ONLY'>('ALL')
  const [adScheduleTemplateId, setAdScheduleTemplateId] = useState<string>('')
  const [count, setCount] = useState<string>('1')
  const [finalUrls, setFinalUrls] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ customerId: string; success: boolean; campaignId?: string; error?: string }> | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/campaign-templates')
        const data = await res.json()
        if (res.ok && data.success) {
          setTemplates(data.templates || [])
        }
      } catch (e) {
        // ignore
      }
    }
    fetchTemplates()
  }, [])

  const parsedUrls = useMemo(() => finalUrls.split(/\r?\n/).map(l => l.trim()).filter(Boolean), [finalUrls])
  const n = useMemo(() => Math.max(0, Math.min(20, Number(count) || 0)), [count])

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds])

  const canSubmit = useMemo(() => {
    if (!selectedTemplateId) return false
    if (n < 1) return false
    if (parsedUrls.length !== n) return false
    if (readyAccounts.length < n) return false
    if (selectedIds.size > 0 && selectedIds.size !== n) return false
    return true
  }, [selectedTemplateId, n, parsedUrls.length, readyAccounts.length, selectedIds.size])

  const autoSelectFirstN = () => {
    const next = new Set<string>()
    for (let i = 0; i < Math.min(n, readyAccounts.length); i++) next.add(readyAccounts[i].id)
    setSelectedIds(next)
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const onSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setResults([])

    try {
      let accounts: string[] = selectedList
      if (accounts.length === 0) {
        accounts = readyAccounts.slice(0, n).map(a => a.id)
      }
      const items = accounts.map((customerId, idx) => ({ customerId, finalUrl: parsedUrls[idx] }))
      // Chunk items to avoid long-running single requests (e.g., chunks of 3)
      const chunkSize = 3
      const aggregate: Array<{ customerId: string; success: boolean; campaignId?: string; error?: string }> = []
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)
        const res = await fetch('/api/campaigns/bulk-deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplateId,
            overrides: {
              deviceTargeting,
              adScheduleTemplateId: adScheduleTemplateId === 'default' ? undefined : adScheduleTemplateId,
            },
            items: chunk,
          })
        })

        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const payload = isJson ? await res.json() : { error: await res.text() }

        if (!res.ok || !payload.success) {
          const errMsg = typeof payload.error === 'string' ? payload.error : JSON.stringify(payload.error || payload)
          throw new Error(errMsg || 'Bulk deploy failed')
        }
        const partial = Array.isArray(payload.results) ? payload.results : []
        aggregate.push(...partial)
        setResults([...aggregate])
      }
      // done
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : JSON.stringify(e)
      setError(msg || 'Bulk deploy failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (results && results.length > 0) {
    const ok = results.filter(r => r.success).length
    const fail = results.length - ok
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bulk Deployment Results</CardTitle>
          <CardDescription>{ok} succeeded, {fail} failed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {results.map((r, i) => (
              <div key={i} className={`p-2 rounded border ${r.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="font-mono">{r.customerId}</div>
                {r.success ? (
                  <div className="text-green-700 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> campaignId: {r.campaignId}</div>
                ) : (
                  <div className="text-red-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {r.error || 'failed'}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => { setResults(null) }}>Back to Form</Button>
            <Button variant="outline" onClick={onBack}>Exit</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Deploy from Template</CardTitle>
        <CardDescription>Pick a template and apply settings once, then deploy to N accounts with N unique final URLs.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Device Targeting</label>
              <Select value={deviceTargeting} onValueChange={(v: any) => setDeviceTargeting(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Devices</SelectItem>
                  <SelectItem value="MOBILE_ONLY">Mobile Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ad Schedule Template</label>
              <Select value={adScheduleTemplateId} onValueChange={(v: any) => setAdScheduleTemplateId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Use template default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use template default</SelectItem>
                  <SelectItem value="est_business_hours">EST Business Hours</SelectItem>
                  <SelectItem value="amsterdam_evening_rush">Amsterdam Evening Rush</SelectItem>
                  <SelectItem value="energie">Energie (10:00-20:30 Mon-Fri)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">How many campaigns/accounts?</label>
              <Input type="number" min={1} max={20} value={count} onChange={e => setCount(e.target.value)} />
              <div className="text-xs text-gray-500 mt-1">Max 20 per batch</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Final URLs (one per line, exactly N)</label>
              <Textarea value={finalUrls} onChange={e => setFinalUrls(e.target.value)} rows={6} />
              <div className="text-xs text-gray-500 mt-1">Count: {parsedUrls.length} / N: {n}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Pick N accounts (optional)</label>
              <Button variant="outline" size="sm" onClick={autoSelectFirstN}>Auto-select first {n}</Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-auto p-2 border rounded">
              {readyAccounts.map(acc => (
                <label key={acc.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedIds.has(acc.id)} onChange={() => toggleSelect(acc.id)} />
                  <span className="font-mono text-xs">{acc.id}</span>
                  <span className="text-xs text-gray-600 truncate">{acc.name}</span>
                  {acc.testAccount && <span className="text-[10px] px-1 bg-orange-100 text-orange-700 rounded">Test</span>}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Deploying…</>) : 'Start Bulk Deploy'}
            </Button>
            <Button variant="outline" onClick={onBack}>Cancel</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}