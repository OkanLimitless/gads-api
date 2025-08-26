import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import getMongoClientPromise from '@/lib/mongodb'
import { createCampaign } from '@/lib/google-ads-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BulkDeployItem {
  customerId: string
  finalUrl: string
}

interface Overrides {
  deviceTargeting?: 'ALL' | 'MOBILE_ONLY'
  adScheduleTemplateId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.refreshToken) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, items, overrides }: { templateId: string; items: BulkDeployItem[]; overrides?: Overrides } = body

    if (!templateId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'templateId and non-empty items are required' }, { status: 400 })
    }

    // Safety caps
    const MAX_BATCH = 20
    const MAX_CONCURRENCY = 3
    const batch = items.slice(0, MAX_BATCH)

    // Fetch template from MongoDB
    const client = await getMongoClientPromise()
    const db = client.db('google_ads_manager')
    const collection = db.collection('campaign_templates')
    const templateDoc = await collection.findOne({ _id: templateId }) || await collection.findOne({ _id: new (require('mongodb').ObjectId)(templateId) }).catch(() => null)

    if (!templateDoc) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
    }

    const tpl = templateDoc.data || {}

    // Build base campaign data from template + overrides (applied once for all)
    const baseCampaign = {
      // Name will be set per-item
      budgetAmountMicros: Math.round((tpl.budget || 10) * 1_000_000),
      biddingStrategy: undefined as string | undefined,
      campaignType: 'SEARCH',
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined,
      adGroupName: 'Ad Group 1',
      defaultBidMicros: 1_000_000,
      finalUrl: '', // per-item
      finalMobileUrl: undefined as string | undefined,
      path1: tpl.path1 || undefined,
      path2: tpl.path2 || undefined,
      headlines: tpl.headlines || [],
      descriptions: tpl.descriptions || [],
      keywords: tpl.keywords || [],
      locations: tpl.locations || [],
      languageCode: tpl.languageCode || 'en',
      deviceTargeting: overrides?.deviceTargeting ?? tpl.deviceTargeting ?? 'ALL',
      adScheduleTemplateId: overrides?.adScheduleTemplateId ?? tpl.adScheduleTemplateId,
      networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false },
    }

    // Validate template-derived requirements
    if (!Array.isArray(baseCampaign.headlines) || baseCampaign.headlines.length < 3) {
      return NextResponse.json({ success: false, error: 'Template invalid: requires at least 3 headlines' }, { status: 400 })
    }
    if (!Array.isArray(baseCampaign.descriptions) || baseCampaign.descriptions.length < 2) {
      return NextResponse.json({ success: false, error: 'Template invalid: requires at least 2 descriptions' }, { status: 400 })
    }
    if (!Array.isArray(baseCampaign.keywords) || baseCampaign.keywords.length === 0) {
      return NextResponse.json({ success: false, error: 'Template invalid: requires at least 1 keyword' }, { status: 400 })
    }

    // Concurrency-limited execution with retry
    const results: Array<{ customerId: string; success: boolean; campaignId?: string; error?: string }> = []

    const queue = [...batch].map((item, index) => ({ ...item, index }))
    const workers: Promise<void>[] = []

    const runOne = async (item: BulkDeployItem, idx: number) => {
      const nameBase = (templateDoc.name || 'Campaign') as string
      const today = new Date().toISOString().split('T')[0]
      const campaignName = `${nameBase} - ${today} - ${idx + 1}`

      const campaignData = {
        ...baseCampaign,
        name: campaignName,
        finalUrl: item.finalUrl,
      }

      // Up to 2 attempts for transient errors
      let attempt = 0
      while (attempt < 2) {
        attempt++
        try {
          const res = await createCampaign(item.customerId, session.refreshToken!, campaignData as any)
          if (res.success) {
            results.push({ customerId: item.customerId, success: true, campaignId: res.campaignId })
          } else {
            const errMsg = res.error || 'Unknown error'
            if (attempt < 2 && /quota|rate|timeout|temporar/i.test(errMsg)) {
              await new Promise(r => setTimeout(r, 1000 * attempt))
              continue
            }
            results.push({ customerId: item.customerId, success: false, error: errMsg })
          }
          break
        } catch (e: any) {
          const errMsg = e?.message || String(e)
          if (attempt < 2 && /quota|rate|timeout|temporar/i.test(errMsg)) {
            await new Promise(r => setTimeout(r, 1000 * attempt))
            continue
          }
          results.push({ customerId: item.customerId, success: false, error: errMsg })
          break
        }
      }
    }

    for (let i = 0; i < MAX_CONCURRENCY; i++) {
      const worker = (async () => {
        while (queue.length > 0) {
          const next = queue.shift()!
          await runOne({ customerId: next.customerId, finalUrl: next.finalUrl }, next.index)
        }
      })()
      workers.push(worker)
    }

    await Promise.all(workers)

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Error during bulk deploy:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}