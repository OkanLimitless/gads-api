import { getDummyCampaignTrackingCollection } from './mongodb'
import { getCampaignPerformance, getCampaigns } from './google-ads-client'

export interface DummyCampaignRecord {
  _id?: string
  accountId: string
  campaignId: string
  campaignName: string
  budgetId: string
  templateName: string
  createdAt: string
  lastChecked?: string
  totalSpent?: number // in micros
  isReadyForReal?: boolean
  performanceHistory?: {
    date: string
    spent: number // in micros
    impressions?: number
    clicks?: number
  }[]
}

// Track a newly created dummy campaign
export async function trackDummyCampaign(data: {
  accountId: string
  campaignId: string
  campaignName: string
  budgetId: string
  templateName: string
}): Promise<void> {
  try {
    const collection = await getDummyCampaignTrackingCollection()
    
    const record: DummyCampaignRecord = {
      ...data,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
      isReadyForReal: false,
      performanceHistory: []
    }
    
    await collection.insertOne(record)
    console.log(`✅ Tracked dummy campaign: ${data.campaignId} for account ${data.accountId}`)
  } catch (error) {
    console.error('💥 Error tracking dummy campaign:', error)
  }
}

// Update dummy campaign performance data
export async function updateDummyCampaignPerformance(
  accountId: string,
  refreshToken: string
): Promise<void> {
  try {
    const collection = await getDummyCampaignTrackingCollection()
    
    // Get all dummy campaigns for this account
    const dummyCampaigns = await collection.find({ accountId }).toArray()
    
    if (dummyCampaigns.length === 0) {
      console.log(`📊 No dummy campaigns found for account ${accountId}`)
      return
    }
    
    // Calculate date range for last 30 days to get comprehensive performance data
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const dateRange = {
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: endDate.toISOString().split('T')[0]
    }
    
    console.log(`📊 Fetching performance data for account ${accountId} from ${dateRange.startDate} to ${dateRange.endDate}`)
    
    // Get campaign performance data from Google Ads (with actual metrics!)
    const performanceData = await getCampaignPerformance(accountId, refreshToken, dateRange)
    
    for (const dummyCampaign of dummyCampaigns) {
      // Get all performance records for this campaign
      const campaignPerformance = performanceData.filter(p => p.campaignId === dummyCampaign.campaignId)
      
      if (campaignPerformance.length > 0) {
        // Update performance history with daily data
        const performanceHistory = dummyCampaign.performanceHistory || []
        
        // Process each day's performance data
        for (const dayPerformance of campaignPerformance) {
          const existingRecord = performanceHistory.find(p => p.date === dayPerformance.date)
          const costMicros = Math.round(dayPerformance.cost * 1000000) // Convert dollars back to micros
          
          if (existingRecord) {
            // Update existing record
            existingRecord.spent = costMicros
            existingRecord.impressions = dayPerformance.impressions
            existingRecord.clicks = dayPerformance.clicks
          } else {
            // Add new record
            performanceHistory.push({
              date: dayPerformance.date,
              spent: costMicros,
              impressions: dayPerformance.impressions,
              clicks: dayPerformance.clicks
            })
          }
        }
        
        // Sort performance history by date (newest first)
        performanceHistory.sort((a, b) => b.date.localeCompare(a.date))
        
        // Calculate total spent in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
        
        const last7DaysSpent = performanceHistory
          .filter(p => p.date >= sevenDaysAgoStr)
          .reduce((total, p) => total + p.spent, 0)
        
        // Calculate total spent overall
        const totalSpent = performanceHistory.reduce((total, p) => total + p.spent, 0)
        
        // Check if ready for real campaign (spent over 10 euros = 10,000,000 micros in last 7 days)
        const isReadyForReal = last7DaysSpent > 10000000
        
        // Update the record
        await collection.updateOne(
          { _id: dummyCampaign._id },
          {
            $set: {
              lastChecked: new Date().toISOString(),
              totalSpent: totalSpent,
              isReadyForReal,
              performanceHistory
            }
          }
        )
        
        console.log(`📊 Updated performance for campaign ${dummyCampaign.campaignId}: €${(last7DaysSpent / 1000000).toFixed(2)} spent in last 7 days, €${(totalSpent / 1000000).toFixed(2)} total (Ready: ${isReadyForReal})`)
      } else {
        console.log(`📊 No performance data found for campaign ${dummyCampaign.campaignId}`)
      }
    }
  } catch (error) {
    console.error('💥 Error updating dummy campaign performance:', error)
  }
}

// Get accounts that are ready for real campaigns (have high-spending dummy campaigns but NO real campaigns)
import { getAllFromCache } from './mcc-cache'

export async function getAccountsReadyForRealCampaigns(refreshToken?: string, options?: { useCacheCounts?: boolean; mccId?: string }): Promise<{
  accountId: string
  campaignCount: number
  totalSpentLast7Days: number // in euros
  dummyCampaigns: {
    campaignId: string
    campaignName: string
    spentLast7Days: number
    templateName: string
  }[]
  hasRealCampaigns?: boolean
}[]> {
  try {
    const collection = await getDummyCampaignTrackingCollection()
    
    // Get all dummy campaigns that are ready
    const readyCampaigns = await collection.find({ isReadyForReal: true }).toArray()
    
    // Group by account
    const accountMap = new Map()
    
    for (const campaign of readyCampaigns) {
      if (!accountMap.has(campaign.accountId)) {
        accountMap.set(campaign.accountId, {
          accountId: campaign.accountId,
          campaignCount: 0,
          totalSpentLast7Days: 0,
          dummyCampaigns: [],
          hasRealCampaigns: false
        })
      }
      
      const account = accountMap.get(campaign.accountId)
      
      // Calculate spent in last 7 days for this campaign
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
      
      const spentLast7Days = (campaign.performanceHistory || [])
        .filter((p: any) => p.date >= sevenDaysAgoStr)
        .reduce((total: number, p: any) => total + p.spent, 0)
      
      account.campaignCount++
      account.totalSpentLast7Days += spentLast7Days / 1000000 // Convert to euros
      account.dummyCampaigns.push({
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        spentLast7Days: spentLast7Days / 1000000,
        templateName: campaign.templateName
      })
    }
    
    const accountsWithReadyDummies = Array.from(accountMap.values())
    
    // If refreshToken is provided, check for real campaigns and filter out accounts that have them
    if (refreshToken && accountsWithReadyDummies.length > 0) {
      if (options?.useCacheCounts) {
        // Fast path: use cached total campaign counts to infer presence of real campaigns
        const mccId = options?.mccId || '1284928552'
        console.log(`🔍 Using cached campaign counts from MCC ${mccId} to filter real campaigns for ${accountsWithReadyDummies.length} accounts...`)
        const cached = await getAllFromCache(mccId)
        const byAccount: Record<string, number> = {}
        cached.forEach(a => { if (typeof a.campaignCount === 'number') byAccount[a.accountId] = a.campaignCount as number })

        const filtered = accountsWithReadyDummies.filter(account => {
          const totalCampaigns = byAccount[account.accountId]
          if (typeof totalCampaigns !== 'number') return true // if unknown, keep it for now
          const dummyCount = account.dummyCampaigns.length
          const realCount = Math.max(0, totalCampaigns - dummyCount)
          account.hasRealCampaigns = realCount > 0
          return realCount === 0
        })

        console.log(`🎯 Filtered accounts (cache-based): ${filtered.length}/${accountsWithReadyDummies.length} with zero real campaigns`)
        return filtered
      } else {
        console.log(`🔍 Checking ${accountsWithReadyDummies.length} accounts for existing real campaigns (live GAQL)...`)
        const accountsWithoutRealCampaigns = []
        for (const account of accountsWithReadyDummies) {
          try {
            const allCampaigns = await getCampaigns(account.accountId, refreshToken)
            const dummyCampaignIds = account.dummyCampaigns.map(dc => dc.campaignId)
            const realCampaigns = allCampaigns.filter(campaign => !dummyCampaignIds.includes(campaign.id))
            account.hasRealCampaigns = realCampaigns.length > 0
            if (realCampaigns.length === 0) {
              accountsWithoutRealCampaigns.push(account)
              console.log(`✅ Account ${account.accountId}: Only dummy campaigns found (${dummyCampaignIds.length} dummy, 0 real)`)            
            } else {
              console.log(`❌ Account ${account.accountId}: Has real campaigns (${dummyCampaignIds.length} dummy, ${realCampaigns.length} real) - excluded`)
            }
          } catch (error) {
            console.error(`💥 Error checking campaigns for account ${account.accountId}:`, error)
            // On error, include the account (better to show than hide)
            accountsWithoutRealCampaigns.push(account)
          }
        }
        console.log(`🎯 Filtered accounts (live): ${accountsWithoutRealCampaigns.length}/${accountsWithReadyDummies.length} accounts have only dummy campaigns`)
        return accountsWithoutRealCampaigns
      }
    }
    
    // If no refreshToken provided, return all accounts with ready dummies (legacy behavior)
    return accountsWithReadyDummies
  } catch (error) {
    console.error('💥 Error getting accounts ready for real campaigns:', error)
    return []
  }
}

// Check if a specific account is ready for real campaigns
export async function isAccountReadyForRealCampaign(accountId: string): Promise<boolean> {
  try {
    const collection = await getDummyCampaignTrackingCollection()
    
    const readyCampaigns = await collection.countDocuments({
      accountId,
      isReadyForReal: true
    })
    
    return readyCampaigns > 0
  } catch (error) {
    console.error('💥 Error checking if account is ready:', error)
    return false
  }
}

// Clean up dummy campaign data for accounts that are no longer in the MCC
export async function cleanupStaleAccountData(validAccountIds: string[]): Promise<{
  removedCampaigns: number
  affectedAccounts: string[]
}> {
  try {
    const collection = await getDummyCampaignTrackingCollection()
    
    // Find campaigns for accounts that are no longer in the MCC
    const staleCampaigns = await collection.find({
      accountId: { $nin: validAccountIds }
    }).toArray()
    
    if (staleCampaigns.length === 0) {
      console.log('✅ No stale campaign data found')
      return { removedCampaigns: 0, affectedAccounts: [] }
    }
    
    // Get unique account IDs that will be affected
    const affectedAccounts = [...new Set(staleCampaigns.map(campaign => campaign.accountId))]
    
    console.log(`🧹 Found ${staleCampaigns.length} campaigns from ${affectedAccounts.length} stale accounts`)
    console.log(`📋 Stale accounts: ${affectedAccounts.join(', ')}`)
    
    // Remove the stale data
    const deleteResult = await collection.deleteMany({
      accountId: { $nin: validAccountIds }
    })
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} stale campaign records`)
    
    return {
      removedCampaigns: deleteResult.deletedCount,
      affectedAccounts
    }
  } catch (error) {
    console.error('💥 Error cleaning up stale account data:', error)
    throw error
  }
}