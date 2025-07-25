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
  isManager: boolean
  managerCustomerId?: string
  level: number
  accountType: 'MCC' | 'CLIENT' | 'UNKNOWN'
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
  
  // Prioritize explicit GOOGLE_ADS_REDIRECT_URI, then NEXTAUTH_URL, then VERCEL_URL
  let redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI
  if (!redirectUri) {
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    
    // Handle Vercel URL - add https:// if missing
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }
    
    if (baseUrl) {
      redirectUri = `${baseUrl}/api/auth/google/callback`
    } else {
      redirectUri = 'http://localhost:3000/api/auth/google/callback'
    }
  }
  
  console.log('OAuth URL generation - using redirect URI:', redirectUri)
  console.log('Environment check:', {
    GOOGLE_ADS_REDIRECT_URI: !!process.env.GOOGLE_ADS_REDIRECT_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL
  })
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent', // This ensures we get a refresh token
    include_granted_scopes: 'true',
    ...(state && { state })
  })
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}> {
  // Prioritize explicit GOOGLE_ADS_REDIRECT_URI, then NEXTAUTH_URL, then VERCEL_URL (must match getOAuthUrl)
  let redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI
  if (!redirectUri) {
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    
    // Handle Vercel URL - add https:// if missing
    if (baseUrl && !baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }
    
    if (baseUrl) {
      redirectUri = `${baseUrl}/api/auth/google/callback`
    } else {
      redirectUri = 'http://localhost:3000/api/auth/google/callback'
    }
  }
  
  console.log('Token exchange - using redirect URI:', redirectUri)
  console.log('Environment check:', {
    GOOGLE_ADS_REDIRECT_URI: !!process.env.GOOGLE_ADS_REDIRECT_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL
  })
  
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
    const errorText = await response.text()
    console.error('OAuth token exchange failed:', response.status, errorText)
    throw new Error(`OAuth token exchange failed: ${response.status} - ${errorText}`)
  }
  
  const tokenData = await response.json()
  console.log('Token exchange successful:', { 
    hasAccessToken: !!tokenData.access_token,
    hasRefreshToken: !!tokenData.refresh_token,
    expiresIn: tokenData.expires_in 
  })
  
  return tokenData
}

// Real Google Ads API functions
export async function getAccessibleCustomers(refreshToken: string): Promise<AdAccount[]> {
  try {
    console.log('🔍 Starting getAccessibleCustomers...')
    console.log('🔑 Refresh token provided:', refreshToken ? 'Yes' : 'No')
    console.log('🔧 Environment check:', {
      hasClientId: !!process.env.GOOGLE_ADS_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
      hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    })

    console.log('📡 Calling listAccessibleCustomers...')
    const accessibleCustomers = await googleAdsClient.listAccessibleCustomers(refreshToken)
    console.log('✅ Got accessible customers:', {
      count: accessibleCustomers.resource_names?.length || 0,
      resourceNames: accessibleCustomers.resource_names,
      fullResponse: accessibleCustomers
    })
    
    // Get detailed information for each customer
    console.log('🔍 Fetching detailed customer information...')
    const customerDetails = await Promise.all(
      accessibleCustomers.resource_names.map(async (resourceName: string) => {
        const customerId = resourceName.split('/')[1]
        console.log(`📋 Processing customer ${customerId}...`)
        
        // Hardcode your known MCC account for now
        const knownMCCId = '1284928552'
        const isKnownMCC = customerId === knownMCCId
        
        if (isKnownMCC) {
          console.log(`🎯 Found known MCC account: ${customerId}`)
        }
        
        try {
          const customerClient = googleAdsClient.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
          })

          // Get customer info using GAQL query
          const customerQuery = `
            SELECT 
              customer.descriptive_name,
              customer.manager,
              customer.currency_code,
              customer.time_zone,
              customer.status,
              customer.test_account
            FROM customer
            LIMIT 1
          `
          
          console.log(`📋 Querying customer details for ${customerId}...`)
          const customerInfo = await customerClient.query({
            query: customerQuery,
          })

          let customer: any = {}
          let isManager = isKnownMCC // Default to true for known MCC

          if (customerInfo.length > 0) {
            customer = customerInfo[0].customer || {}
            // Override isManager for known MCC or use API response
            isManager = isKnownMCC || customer.manager === true
            
            console.log(`✅ Customer ${customerId} details:`, {
              name: customer.descriptive_name,
              isManager: isManager,
              currency: customer.currency_code,
              status: customer.status,
              isKnownMCC: isKnownMCC,
              rawCustomer: customer
            })
          } else {
            console.warn(`⚠️ No customer info found for ${customerId}, using defaults`)
            isManager = isKnownMCC
          }
          
          // Get manager-customer links to understand hierarchy
          let managerCustomerId: string | undefined
          let level = 0
          
          try {
            // Query customer manager links using GAQL
            const managerLinksQuery = `
              SELECT 
                customer_manager_link.manager_customer,
                customer_manager_link.status
              FROM customer_manager_link
              WHERE customer_manager_link.status = 'ACTIVE'
            `
            
            console.log(`🔗 Querying manager links for ${customerId}...`)
            const managerLinksResponse = await customerClient.query({
              query: managerLinksQuery,
            })

            console.log(`📋 Manager links for ${customerId}:`, managerLinksResponse)

            if (managerLinksResponse.length > 0) {
              const managerLink = managerLinksResponse[0]
              if (managerLink.customer_manager_link?.manager_customer) {
                managerCustomerId = managerLink.customer_manager_link.manager_customer.split('/')[1]
                level = isManager ? 1 : 1 // Both can be level 1 if they have a parent
                console.log(`👆 ${customerId} is managed by ${managerCustomerId}`)
              }
            }

            // For manager accounts, also check how many clients they manage
            if (isManager) {
              const clientsQuery = `
                SELECT 
                  customer_client.client_customer,
                  customer_client.level,
                  customer_client.manager
                FROM customer_client
                WHERE customer_client.level <= 2
              `
              
              console.log(`👥 Checking clients managed by ${customerId}...`)
              const clientsResponse = await customerClient.query({
                query: clientsQuery,
              })

              console.log(`📊 ${customerId} manages ${clientsResponse.length} client accounts:`, 
                clientsResponse.map((c: any) => ({
                  client: c.customer_client?.client_customer,
                  level: c.customer_client?.level,
                  isManager: c.customer_client?.manager
                }))
              )
            }
          } catch (linkError) {
            console.log(`⚠️ Could not fetch manager links for ${customerId}:`, linkError)
          }
          
          const accountDetails = {
            id: customerId,
            name: customer.descriptive_name || `Account ${customerId}`,
            currency: customer.currency_code || 'USD',
            timeZone: customer.time_zone || 'UTC',
            status: customer.status || 'UNKNOWN',
            canManageCampaigns: !isManager, // Only non-manager accounts can have campaigns
            testAccount: customer.test_account || false,
            isManager,
            managerCustomerId,
            level,
            accountType: isManager ? 'MCC' : 'CLIENT',
          } as AdAccount

          console.log(`✅ Processed customer ${customerId}:`, accountDetails)
          return accountDetails
        } catch (error) {
          console.error(`❌ Error fetching details for customer ${customerId}:`, error)
          const fallbackIsManager = isKnownMCC
          return {
            id: customerId,
            name: isKnownMCC ? `MCC Account ${customerId}` : `Account ${customerId}`,
            currency: 'USD',
            timeZone: 'UTC',
            status: 'UNKNOWN',
            canManageCampaigns: !fallbackIsManager,
            testAccount: false,
            isManager: fallbackIsManager,
            level: 0,
            accountType: fallbackIsManager ? 'MCC' : 'UNKNOWN',
          } as AdAccount
        }
      })
    )

    // Sort accounts: MCC accounts first, then client accounts, then by name
    const sortedAccounts = customerDetails.sort((a, b) => {
      if (a.isManager && !b.isManager) return -1
      if (!a.isManager && b.isManager) return 1
      if (a.level !== b.level) return a.level - b.level
      return a.name.localeCompare(b.name)
    })

    const mccAccounts = sortedAccounts.filter(acc => acc.isManager)
    const clientAccounts = sortedAccounts.filter(acc => !acc.isManager)

    console.log('🎉 Final sorted accounts:', {
      total: sortedAccounts.length,
      managers: mccAccounts.length,
      clients: clientAccounts.length,
      mccDetails: mccAccounts.map(acc => ({ 
        id: acc.id, 
        name: acc.name, 
        type: acc.accountType, 
        isManager: acc.isManager 
      })),
      clientDetails: clientAccounts.map(acc => ({ 
        id: acc.id, 
        name: acc.name, 
        type: acc.accountType, 
        isManager: acc.isManager,
        managedBy: acc.managerCustomerId 
      }))
    })

    return sortedAccounts
  } catch (error) {
    console.error('💥 Error in getAccessibleCustomers:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
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