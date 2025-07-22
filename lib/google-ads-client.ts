import { GoogleAdsApi, Customer } from 'google-ads-api'

// Initialize the Google Ads API client
const googleAdsClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

export interface AdAccount {
  id: string
  name: string
  currency: string
  timeZone: string
  status: string
  canManageCampaigns: boolean
  testAccount: boolean
}

export interface Campaign {
  id: string
  name: string
  status: string
  budget: number
  budgetId: string
  biddingStrategy: string
  startDate: string
  endDate?: string
  campaignType: string
  targetingSettings?: any
}

export interface CampaignPerformance {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  cost: number
  ctr: number
  averageCpc: number
  conversions: number
  conversionRate: number
  costPerConversion: number
  date: string
}

export interface AdGroup {
  id: string
  name: string
  campaignId: string
  status: string
  maxCpc: number
  targetingSettings?: any
}

export interface Keyword {
  id: string
  text: string
  matchType: string
  adGroupId: string
  status: string
  maxCpc: number
  qualityScore?: number
}

// OAuth helper functions
export function getOAuthUrl(state?: string): string {
  const scopes = 'https://www.googleapis.com/auth/adwords'
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state })
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.statusText}`)
  }
  
  return response.json()
}

// Real Google Ads API functions
export async function getAccessibleCustomers(refreshToken: string): Promise<AdAccount[]> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: 'none', // We don't need a specific customer ID for this call
      refresh_token: refreshToken,
    })

    const accessibleCustomers = await customer.listAccessibleCustomers()
    
    // Get detailed information for each customer
    const customerDetails = await Promise.all(
      accessibleCustomers.resource_names.map(async (resourceName: string) => {
        const customerId = resourceName.split('/')[1]
        
        try {
          const customerClient = googleAdsClient.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
          })

          const customerInfo = await customerClient.customers.list({
            limit: 1,
          })

          const customer = customerInfo[0]
          
          return {
            id: customerId,
            name: customer.descriptive_name || `Account ${customerId}`,
            currency: customer.currency_code || 'USD',
            timeZone: customer.time_zone || 'UTC',
            status: customer.status || 'UNKNOWN',
            canManageCampaigns: customer.manager === false, // Non-manager accounts can have campaigns
            testAccount: customer.test_account || false,
          } as AdAccount
        } catch (error) {
          console.error(`Error fetching details for customer ${customerId}:`, error)
          return {
            id: customerId,
            name: `Account ${customerId}`,
            currency: 'USD',
            timeZone: 'UTC',
            status: 'UNKNOWN',
            canManageCampaigns: true,
            testAccount: false,
          } as AdAccount
        }
      })
    )

    return customerDetails
  } catch (error) {
    console.error('Error fetching accessible customers:', error)
    throw new Error('Failed to fetch accessible customers')
  }
}

export async function getCampaigns(customerId: string, refreshToken: string): Promise<Campaign[]> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    })

    const campaigns = await customer.campaigns.list({
      limit: 100,
    })

    return campaigns.map((campaign: any) => ({
      id: campaign.id?.toString() || '',
      name: campaign.name || '',
      status: campaign.status || 'UNKNOWN',
      budget: 0, // We'll fetch this separately
      budgetId: campaign.campaign_budget || '',
      biddingStrategy: campaign.bidding_strategy_type || 'UNKNOWN',
      startDate: campaign.start_date || '',
      endDate: campaign.end_date,
      campaignType: campaign.advertising_channel_type || 'SEARCH',
      targetingSettings: campaign.targeting_setting,
    }))
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    throw new Error('Failed to fetch campaigns')
  }
}

export async function getCampaignPerformance(
  customerId: string, 
  refreshToken: string, 
  dateRange: { startDate: string; endDate: string }
): Promise<CampaignPerformance[]> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    })

    const report = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.id',
        'campaign.name',
      ],
      metrics: [
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.ctr',
        'metrics.average_cpc',
        'metrics.conversions',
        'metrics.conversions_from_interactions_rate',
        'metrics.cost_per_conversion',
      ],
      segments: ['segments.date'],
      date_constant: null,
      from_date: dateRange.startDate,
      to_date: dateRange.endDate,
    })

    return report.map((row: any) => ({
      campaignId: row.campaign?.id?.toString() || '',
      campaignName: row.campaign?.name || '',
      impressions: parseInt(row.metrics?.impressions) || 0,
      clicks: parseInt(row.metrics?.clicks) || 0,
      cost: (parseInt(row.metrics?.cost_micros) || 0) / 1000000, // Convert micros to dollars
      ctr: parseFloat(row.metrics?.ctr) || 0,
      averageCpc: (parseInt(row.metrics?.average_cpc) || 0) / 1000000,
      conversions: parseFloat(row.metrics?.conversions) || 0,
      conversionRate: parseFloat(row.metrics?.conversions_from_interactions_rate) || 0,
      costPerConversion: (parseInt(row.metrics?.cost_per_conversion) || 0) / 1000000,
      date: row.segments?.date || '',
    }))
  } catch (error) {
    console.error('Error fetching campaign performance:', error)
    throw new Error('Failed to fetch campaign performance')
  }
}

export async function createCampaign(
  customerId: string, 
  refreshToken: string, 
  campaignData: {
    name: string
    budget: number
    biddingStrategy: string
    startDate: string
    endDate?: string
    campaignType?: string
  }
): Promise<Campaign> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    })

    // First create a campaign budget
    const budgetOperation = {
      create: {
        name: `${campaignData.name} Budget`,
        amount_micros: campaignData.budget * 1000000, // Convert to micros
        delivery_method: 'STANDARD',
      }
    }

    const budgetResponse = await customer.campaignBudgets.create([budgetOperation])
    const budgetResourceName = budgetResponse.results[0].resource_name

    // Then create the campaign
    const campaignOperation = {
      create: {
        name: campaignData.name,
        advertising_channel_type: campaignData.campaignType || 'SEARCH',
        status: 'PAUSED', // Start paused for safety
        campaign_budget: budgetResourceName,
        start_date: campaignData.startDate.replace(/-/g, ''),
        ...(campaignData.endDate && { end_date: campaignData.endDate.replace(/-/g, '') }),
        bidding_strategy_type: campaignData.biddingStrategy,
        ...(campaignData.biddingStrategy === 'MANUAL_CPC' && {
          manual_cpc: {
            enhanced_cpc_enabled: true
          }
        }),
        ...(campaignData.biddingStrategy === 'MAXIMIZE_CLICKS' && {
          maximize_clicks: {}
        }),
      }
    }

    const campaignResponse = await customer.campaigns.create([campaignOperation])
    const campaignId = campaignResponse.results[0].resource_name.split('/')[3]

    return {
      id: campaignId,
      name: campaignData.name,
      status: 'PAUSED',
      budget: campaignData.budget,
      budgetId: budgetResourceName,
      biddingStrategy: campaignData.biddingStrategy,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      campaignType: campaignData.campaignType || 'SEARCH',
    }
  } catch (error) {
    console.error('Error creating campaign:', error)
    throw new Error('Failed to create campaign')
  }
}

export async function updateCampaign(
  customerId: string,
  refreshToken: string,
  campaignId: string,
  updates: {
    name?: string
    status?: string
    budget?: number
    biddingStrategy?: string
  }
): Promise<Campaign> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    })

    const operations = []

    // Update campaign if needed
    if (updates.name || updates.status || updates.biddingStrategy) {
      const campaignUpdate: any = {
        resource_name: `customers/${customerId}/campaigns/${campaignId}`,
      }

      if (updates.name) campaignUpdate.name = updates.name
      if (updates.status) campaignUpdate.status = updates.status
      if (updates.biddingStrategy) campaignUpdate.bidding_strategy_type = updates.biddingStrategy

      operations.push({
        update: campaignUpdate,
        update_mask: {
          paths: Object.keys(campaignUpdate).filter(key => key !== 'resource_name')
        }
      })
    }

    if (operations.length > 0) {
      await customer.campaigns.update(operations)
    }

    // Update budget if needed (this requires a separate call)
    if (updates.budget) {
      // First get the campaign to find its budget
      const campaigns = await customer.campaigns.list({
        constraints: [`campaign.id = ${campaignId}`],
        limit: 1,
      })

      if (campaigns.length > 0) {
        const budgetResourceName = campaigns[0].campaign_budget
        
        const budgetOperation = {
          update: {
            resource_name: budgetResourceName,
            amount_micros: updates.budget * 1000000,
          },
          update_mask: {
            paths: ['amount_micros']
          }
        }

        await customer.campaignBudgets.update([budgetOperation])
      }
    }

    // Return updated campaign data
    const updatedCampaigns = await getCampaigns(customerId, refreshToken)
    return updatedCampaigns.find(c => c.id === campaignId) || updatedCampaigns[0]
  } catch (error) {
    console.error('Error updating campaign:', error)
    throw new Error('Failed to update campaign')
  }
}

export async function getAdGroups(customerId: string, refreshToken: string, campaignId?: string): Promise<AdGroup[]> {
  try {
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    })

    const constraints = campaignId ? [`ad_group.campaign = "customers/${customerId}/campaigns/${campaignId}"`] : []

    const adGroups = await customer.adGroups.list({
      constraints,
      limit: 100,
    })

    return adGroups.map((adGroup: any) => ({
      id: adGroup.id?.toString() || '',
      name: adGroup.name || '',
      campaignId: adGroup.campaign?.split('/')[3] || '',
      status: adGroup.status || 'UNKNOWN',
      maxCpc: (parseInt(adGroup.cpc_bid_micros) || 0) / 1000000,
      targetingSettings: adGroup.targeting_setting,
    }))
  } catch (error) {
    console.error('Error fetching ad groups:', error)
    throw new Error('Failed to fetch ad groups')
  }
}

export { googleAdsClient }