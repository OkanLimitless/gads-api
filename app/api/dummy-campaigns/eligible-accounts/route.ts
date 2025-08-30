import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GoogleAdsApi } from 'google-ads-api'
import { getCampaigns, getCampaignCount } from '@/lib/google-ads-client'
import { getAllFromCache, HIDDEN_ACCOUNT_IDS } from '@/lib/mcc-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Dummy Campaigns - Fetching eligible accounts (0 campaigns)')
    const session = await getServerSession(authOptions)

    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Use hardcoded MCC ID as specified
    const mccId = '1284928552'
    
    // Hidden account IDs that should be excluded from selection
    const hiddenAccountIds = [
      '7543640452', '1981739507', '2455272543', 
      '2943276700', '5353988239', '5299881560', '6575141691'
    ]

    console.log(`🏢 Fetching client accounts for MCC: ${mccId}`)

    // Initialize Google Ads client
    const googleAdsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })

    // Create customer client for the MCC account
    const mccCustomerClient = googleAdsClient.Customer({
      customer_id: mccId,
      refresh_token: session.refreshToken,
    })

    // Prefer cached accounts for speed
    const cachedAccounts = (await getAllFromCache(mccId)).filter(a => a.status !== 'CANCELED' && !HIDDEN_ACCOUNT_IDS.includes(a.accountId))
    let clientAccounts = cachedAccounts
      .filter(a => !hiddenAccountIds.includes(a.accountId))
      .map(a => ({
        id: a.accountId,
        name: a.name,
        currency: a.currency || 'USD',
        timeZone: a.timeZone || 'UTC',
        status: a.status || 'UNKNOWN',
        canManageCampaigns: true,
        testAccount: !!a.testAccount,
        isManager: false,
        managerCustomerId: mccId,
        level: a.level || 1,
        accountType: 'CLIENT' as const,
        campaignCount: a.campaignCount,
      }))

    if (!clientAccounts || clientAccounts.length === 0) {
      // Fallback to live query if cache empty
      const clientsQuery = `
        SELECT 
          customer_client.client_customer,
          customer_client.descriptive_name,
          customer_client.currency_code,
          customer_client.time_zone,
          customer_client.status,
          customer_client.test_account,
          customer_client.manager,
          customer_client.level
        FROM customer_client
        WHERE customer_client.level = 1
        AND customer_client.manager = false
      `
      const clientsResponse = await mccCustomerClient.query(clientsQuery)
      clientAccounts = clientsResponse
        .map((item: any) => {
          const client = item.customer_client
          const clientId = client.client_customer?.split('/')[1] || 'unknown'
          return {
            id: clientId,
            name: client.descriptive_name || `Client Account ${clientId}`,
            currency: client.currency_code || 'USD',
            timeZone: client.time_zone || 'UTC',
            status: client.status || 'UNKNOWN',
            canManageCampaigns: true,
            testAccount: client.test_account || false,
            isManager: false,
            managerCustomerId: mccId,
            level: client.level || 1,
            accountType: 'CLIENT' as const,
          }
        })
        .filter(account => !hiddenAccountIds.includes(account.id) && account.status !== 'CANCELED' && !HIDDEN_ACCOUNT_IDS.includes(account.id))
    }

    console.log(`🔍 Using cached campaign counts for ${clientAccounts.length} accounts (will refresh in background)...`)

    // Use cached counts if present; otherwise skip to keep it fast and trigger background refresh
    const eligibleAccounts = [] as any[]
    const accountResults = [] as any[]
    const withCounts = clientAccounts.filter(a => typeof a.campaignCount === 'number')
    const withoutCounts = clientAccounts.filter(a => typeof a.campaignCount !== 'number')

    for (const account of withCounts) {
      const campaignCount = account.campaignCount as number
      const ok = campaignCount === 0
      accountResults.push({ accountId: account.id, accountName: account.name, campaignCount, status: 'cached', eligible: ok })
      if (ok) eligibleAccounts.push({ ...account, campaignCount })
    }

    // Fast fallback: if no cached counts exist yet, sample a limited subset with concurrency
    if (withCounts.length === 0 && withoutCounts.length > 0) {
      console.log(`⚠️ No cached campaign counts found. Sampling up to 40 accounts live with limited concurrency...`)
      const sample = withoutCounts.slice(0, 40)
      const concurrency = 6
      let inFlight = 0
      const queue = [...sample]
      const runNext = async (): Promise<void> => {
        if (queue.length === 0) return
        if (inFlight >= concurrency) return
        const acc = queue.shift()!
        inFlight++
        ;(async () => {
          try {
            const count = await getCampaignCount(acc.id, session.refreshToken)
            const ok = count === 0
            accountResults.push({ accountId: acc.id, accountName: acc.name, campaignCount: count, status: 'live', eligible: ok })
            if (ok) eligibleAccounts.push({ ...acc, campaignCount: 0 })
          } catch (e) {
            accountResults.push({ accountId: acc.id, accountName: acc.name, campaignCount: -1, status: 'error', eligible: false, error: e instanceof Error ? e.message : String(e) })
          } finally {
            inFlight--
            await runNext()
          }
        })()
        if (inFlight < concurrency && queue.length > 0) await runNext()
      }
      const starters = Math.min(concurrency, queue.length)
      await Promise.all(new Array(starters).fill(0).map(() => runNext()))
      while (inFlight > 0) { await new Promise(r => setTimeout(r, 100)) }
    }

    // Fire-and-forget background refresh of counts
    try { fetch(`/api/cache/mcc/campaign-counts/refresh?mccId=${mccId}`, { method: 'POST' }).catch(() => {}) } catch {}

    console.log(`🎯 Found ${eligibleAccounts.length} eligible accounts (0 campaigns) out of ${clientAccounts.length} total accounts`)
    
    // Log summary of all account results for debugging
    console.log('📊 Account Analysis Summary:')
    const successCount = accountResults.filter(r => r.status === 'success').length
    const errorCount = accountResults.filter(r => r.status === 'error').length
    const eligibleCount = accountResults.filter(r => r.eligible).length
    console.log(`✅ Successfully checked: ${successCount}`)
    console.log(`❌ Errors encountered: ${errorCount}`)
    console.log(`🎯 Eligible (0 campaigns): ${eligibleCount}`)
    
    // Log first few account details for debugging
    console.log('📋 Sample account results:')
    accountResults.slice(0, 5).forEach(result => {
      console.log(`  - ${result.accountName} (${result.accountId}): ${result.campaignCount} campaigns, ${result.status}${result.error ? `, error: ${result.error}` : ''}`)
    })

    return NextResponse.json({
      success: true,
      mccId,
      eligibleAccounts,
      totalEligible: eligibleAccounts.length,
      totalChecked: clientAccounts.length,
      criteria: 'Accounts with 0 campaigns',
      debug: {
        accountResults: accountResults.slice(0, 10), // Include first 10 for debugging
        summary: {
          successCount,
          errorCount,
          eligibleCount
        }
      }
    })

  } catch (error) {
    console.error('💥 Error fetching eligible accounts for dummy campaigns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch eligible accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}