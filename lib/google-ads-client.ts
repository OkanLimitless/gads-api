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
    
    // Only process the hardcoded MCC account to avoid deactivated account errors
    console.log('🔍 Fetching detailed customer information...')
    const knownMCCId = '1284928552'
    
    // Filter to only include the known MCC account
    const filteredResourceNames = accessibleCustomers.resource_names.filter((resourceName: string) => {
      const customerId = resourceName.split('/')[1]
      return customerId === knownMCCId
    })
    
    console.log(`🎯 Processing only known MCC account: ${knownMCCId}`)
    console.log(`📊 Filtered from ${accessibleCustomers.resource_names.length} to ${filteredResourceNames.length} accounts`)
    
    const customerDetails = await Promise.all(
      filteredResourceNames.map(async (resourceName: string) => {
        const customerId = resourceName.split('/')[1]
        console.log(`📋 Processing customer ${customerId}...`)
        
        const isKnownMCC = customerId === knownMCCId
        console.log(`🎯 Found known MCC account: ${customerId}`)
        
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
           const customerInfo = await customerClient.query(customerQuery)

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
             const managerLinksResponse = await customerClient.query(managerLinksQuery)

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
               const clientsResponse = await customerClient.query(clientsQuery)

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

export interface CampaignCreationData {
  name: string
  budgetAmountMicros: number // Budget in micros (e.g., $10 = 10,000,000 micros)
  targetCpa?: number // Target CPA in micros
  targetRoas?: number // Target ROAS as decimal (e.g., 4.0 for 400%)
  biddingStrategy: 'TARGET_CPA' | 'TARGET_ROAS' | 'MAXIMIZE_CONVERSIONS' | 'MANUAL_CPC'
  campaignType: 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'VIDEO'
  startDate?: string // YYYY-MM-DD format
  endDate?: string // YYYY-MM-DD format
  adGroupName?: string
  keywords?: string[] // Keywords to add to default ad group
}

export async function createCampaign(
  customerId: string, 
  refreshToken: string, 
  campaignData: CampaignCreationData
): Promise<{ success: boolean; campaignId?: string; budgetId?: string; adGroupId?: string; error?: string }> {
  try {
    console.log(`🚀 Creating campaign for customer ${customerId}:`, campaignData)
    
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
    })
    
    console.log(`🔑 Using MCC ${knownMCCId} as login customer for client ${customerId}`)

    // Step 1: Create Campaign Budget
    console.log('💰 Creating campaign budget...')
    const budgetOperation = {
      create: {
        name: `Budget for ${campaignData.name}`,
        amount_micros: campaignData.budgetAmountMicros,
        delivery_method: 'STANDARD',
        explicitly_shared: false,
      }
    }

    const budgetResponse = await customer.campaignBudgets.create([budgetOperation])
    const budgetResourceName = budgetResponse.results[0].resource_name
    const budgetId = budgetResourceName.split('/')[3]
    console.log(`✅ Created budget: ${budgetId}`)

    // Step 2: Create Campaign
    console.log('📊 Creating campaign...')
    const campaignOperation = {
      create: {
        name: campaignData.name,
        advertising_channel_type: campaignData.campaignType,
        status: 'PAUSED', // Start paused for safety
        campaign_budget: budgetResourceName,
        start_date: campaignData.startDate || new Date().toISOString().split('T')[0].replace(/-/g, ''),
        end_date: campaignData.endDate,
        network_settings: {
          target_google_search: true,
          target_search_network: true,
          target_content_network: false,
          target_partner_search_network: false,
        }
      }
    }

    // Add bidding strategy
    if (campaignData.biddingStrategy === 'TARGET_CPA' && campaignData.targetCpa) {
      campaignOperation.create.target_cpa = {
        target_cpa_micros: campaignData.targetCpa
      }
    } else if (campaignData.biddingStrategy === 'TARGET_ROAS' && campaignData.targetRoas) {
      campaignOperation.create.target_roas = {
        target_roas: campaignData.targetRoas
      }
    } else if (campaignData.biddingStrategy === 'MAXIMIZE_CONVERSIONS') {
      campaignOperation.create.maximize_conversions = {}
    } else {
      campaignOperation.create.manual_cpc = {
        enhanced_cpc_enabled: true
      }
    }

    const campaignResponse = await customer.campaigns.create([campaignOperation])
    const campaignResourceName = campaignResponse.results[0].resource_name
    const campaignId = campaignResourceName.split('/')[3]
    console.log(`✅ Created campaign: ${campaignId}`)

    // Step 3: Create Default Ad Group (if specified)
    let adGroupId: string | undefined
    if (campaignData.adGroupName) {
      console.log('👥 Creating ad group...')
      const adGroupOperation = {
        create: {
          name: campaignData.adGroupName,
          campaign: campaignResourceName,
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
          cpc_bid_micros: 1000000, // $1 default bid
        }
      }

      const adGroupResponse = await customer.adGroups.create([adGroupOperation])
      const adGroupResourceName = adGroupResponse.results[0].resource_name
      adGroupId = adGroupResourceName.split('/')[3]
      console.log(`✅ Created ad group: ${adGroupId}`)

      // Step 4: Add Keywords (if specified)
      if (campaignData.keywords && campaignData.keywords.length > 0) {
        console.log('🔑 Adding keywords...')
        const keywordOperations = campaignData.keywords.map(keyword => ({
          create: {
            ad_group: adGroupResourceName,
            status: 'ENABLED',
            keyword: {
              text: keyword,
              match_type: 'BROAD'
            },
            cpc_bid_micros: 1000000, // $1 default bid
          }
        }))

        const keywordsResponse = await customer.adGroupCriteria.create(keywordOperations)
        console.log(`✅ Added ${keywordsResponse.results.length} keywords`)
      }
    }

    return {
      success: true,
      campaignId,
      budgetId,
      adGroupId
    }

  } catch (error) {
    console.error('💥 Error creating campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getCampaigns(customerId: string, refreshToken: string): Promise<Campaign[]> {
  try {
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
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
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
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
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
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
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
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