import { getDummyCampaignTrackingCollection } from './mongodb'
import { getCampaigns } from './google-ads-client'

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
    
    // Get campaign performance data from Google Ads
    const campaigns = await getCampaigns(accountId, refreshToken)
    
    for (const dummyCampaign of dummyCampaigns) {
      const gAdsCampaign = campaigns.find(c => c.id === dummyCampaign.campaignId)
      
      if (gAdsCampaign && gAdsCampaign.metrics) {
        const spentMicros = parseInt(gAdsCampaign.metrics.cost_micros || '0')
        const today = new Date().toISOString().split('T')[0]
        
        // Update performance history
        const performanceHistory = dummyCampaign.performanceHistory || []
        const todayRecord = performanceHistory.find(p => p.date === today)
        
        if (todayRecord) {
          todayRecord.spent = spentMicros
          todayRecord.impressions = parseInt(gAdsCampaign.metrics.impressions || '0')
          todayRecord.clicks = parseInt(gAdsCampaign.metrics.clicks || '0')
        } else {
          performanceHistory.push({
            date: today,
            spent: spentMicros,
            impressions: parseInt(gAdsCampaign.metrics.impressions || '0'),
            clicks: parseInt(gAdsCampaign.metrics.clicks || '0')
          })
        }
        
        // Calculate total spent in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
        
        const last7DaysSpent = performanceHistory
          .filter(p => p.date >= sevenDaysAgoStr)
          .reduce((total, p) => total + p.spent, 0)
        
        // Check if ready for real campaign (spent over 10 euros = 10,000,000 micros)
        const isReadyForReal = last7DaysSpent > 10000000
        
        // Update the record
        await collection.updateOne(
          { _id: dummyCampaign._id },
          {
            $set: {
              lastChecked: new Date().toISOString(),
              totalSpent: spentMicros,
              isReadyForReal,
              performanceHistory
            }
          }
        )
        
        console.log(`📊 Updated performance for campaign ${dummyCampaign.campaignId}: €${(last7DaysSpent / 1000000).toFixed(2)} spent in last 7 days`)
      }
    }
  } catch (error) {
    console.error('💥 Error updating dummy campaign performance:', error)
  }
}

// Get accounts that are ready for real campaigns
export async function getAccountsReadyForRealCampaigns(): Promise<{
  accountId: string
  campaignCount: number
  totalSpentLast7Days: number // in euros
  dummyCampaigns: {
    campaignId: string
    campaignName: string
    spentLast7Days: number
    templateName: string
  }[]
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
          dummyCampaigns: []
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
    
    return Array.from(accountMap.values())
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