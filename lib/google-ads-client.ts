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
  biddingStrategy: string
  campaignType: string
  startDate?: string // YYYY-MM-DD format
  endDate?: string // YYYY-MM-DD format
  
  // Ad Group Settings
  adGroupName: string
  defaultBidMicros?: number // Default bid in micros
  
  // Responsive Search Ad
  finalUrl: string
  finalMobileUrl?: string
  path1?: string
  path2?: string
  headlines: string[] // 3-15 headlines, max 30 chars each
  descriptions: string[] // 2-4 descriptions, max 90 chars each
  
  // Keywords
  keywords: string[]
  
  // Location Targeting
  locations?: string[]
  
  // Other Settings
  languageCode?: string
  networkSettings?: {
    targetGoogleSearch: boolean
    targetSearchNetwork: boolean
    targetContentNetwork: boolean
  }
}

export async function createCampaign(
  customerId: string, 
  refreshToken: string, 
  campaignData: CampaignCreationData
): Promise<{ success: boolean; campaignId?: string; budgetId?: string; adGroupId?: string; adId?: string; error?: string }> {
  try {
    console.log(`🚀 Creating campaign for customer ${customerId}:`, {
      campaignData: {
        name: campaignData.name,
        budgetAmountMicros: campaignData.budgetAmountMicros,
        biddingStrategy: campaignData.biddingStrategy,
        campaignType: campaignData.campaignType,
        startDate: campaignData.startDate,
        finalUrl: campaignData.finalUrl,
        headlines: campaignData.headlines,
        descriptions: campaignData.descriptions,
        keywords: campaignData.keywords
      }
    })
    
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
    })
    
    console.log(`🔑 Using MCC ${knownMCCId} as login customer for client ${customerId}`)

    // Import required modules for atomic operations
    const { resources, enums, ResourceNames } = require('google-ads-api')
    
    // Create a resource name with a temporary resource id (-1)
    const budgetResourceName = ResourceNames.campaignBudget(customerId, "-1")
    
    // Step 1: Create Campaign Budget and Campaign atomically
    console.log('💰 Creating campaign budget and campaign atomically...')
    
    // Prepare campaign resource
    const campaignResource = {
      name: campaignData.name,
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
      status: enums.CampaignStatus.PAUSED, // Start paused for safety
      campaign_budget: budgetResourceName,
      start_date: campaignData.startDate || new Date().toISOString().split('T')[0].replace(/-/g, ''),
      end_date: campaignData.endDate,
      network_settings: {
        target_google_search: campaignData.networkSettings?.targetGoogleSearch ?? true,
        target_search_network: campaignData.networkSettings?.targetSearchNetwork ?? false, // Default false for search partners
        target_content_network: campaignData.networkSettings?.targetContentNetwork ?? false, // Default false for display network
        target_partner_search_network: false,
      }
    }

    // Add bidding strategy
    if (campaignData.biddingStrategy === 'TARGET_CPA' && campaignData.targetCpa) {
      campaignResource.target_cpa = {
        target_cpa_micros: campaignData.targetCpa
      }
    } else if (campaignData.biddingStrategy === 'TARGET_ROAS' && campaignData.targetRoas) {
      campaignResource.target_roas = {
        target_roas: campaignData.targetRoas
      }
    } else if (campaignData.biddingStrategy === 'MAXIMIZE_CONVERSIONS') {
      campaignResource.maximize_conversions = {}
    } else if (campaignData.biddingStrategy === 'MAXIMIZE_CONVERSION_VALUE') {
      campaignResource.maximize_conversion_value = {}
    } else {
      campaignResource.manual_cpc = {
        enhanced_cpc_enabled: campaignData.biddingStrategy === 'ENHANCED_CPC'
      }
    }
    
    const operations = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          amount_micros: campaignData.budgetAmountMicros,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          explicitly_shared: false,
        },
      },
      {
        entity: "campaign",
        operation: "create",
        resource: campaignResource,
      },
    ]

    console.log('📊 Operations to execute:', JSON.stringify(operations, null, 2))
    const response = await customer.mutateResources(operations)
    console.log('📋 API Response:', JSON.stringify(response, null, 2))
    
    // Check if response has results (handle both old and new API response formats)
    let budgetResult, campaignResult
    
    if (response.mutate_operation_responses) {
      // New API response format
      if (!response.mutate_operation_responses || response.mutate_operation_responses.length < 2) {
        console.error('Invalid response from Google Ads API:', response)
        throw new Error('Failed to create campaign budget and campaign - invalid API response')
      }
      
      budgetResult = response.mutate_operation_responses[0].campaign_budget_result
      campaignResult = response.mutate_operation_responses[1].campaign_result
    } else if (response.results) {
      // Old API response format
      if (!response.results || response.results.length < 2) {
        console.error('Invalid response from Google Ads API:', response)
        throw new Error('Failed to create campaign budget and campaign - invalid API response')
      }
      
      budgetResult = response.results[0]
      campaignResult = response.results[1]
    } else {
      console.error('Invalid response from Google Ads API:', response)
      throw new Error('Failed to create campaign budget and campaign - invalid API response')
    }
    
    const budgetId = budgetResult.resource_name.split('/')[3]
    const campaignId = campaignResult.resource_name.split('/')[3]
    const campaignResourceName = campaignResult.resource_name
    console.log(`✅ Created budget: ${budgetId} and campaign: ${campaignId}`)

    // Step 3: Create Ad Group using mutateResources
    console.log('👥 Creating ad group...')
    console.log('🔗 Campaign resource name for ad group:', campaignResourceName)
    
    const adGroupOperations = [
      {
        entity: "ad_group",
        operation: "create",
        resource: {
          name: campaignData.adGroupName,
          campaign: campaignResourceName,
          status: enums.AdGroupStatus.ENABLED,
          type: enums.AdGroupType.SEARCH_STANDARD,
          cpc_bid_micros: campaignData.defaultBidMicros || 1000000, // Default $1 bid
        }
      }
    ]
    
    console.log('📋 Ad group operations:', JSON.stringify(adGroupOperations, null, 2))

    const adGroupResponse = await customer.mutateResources(adGroupOperations)
    
    // Handle both old and new response formats for ad groups
    let adGroupResult
    if (adGroupResponse.mutate_operation_responses) {
      if (!adGroupResponse.mutate_operation_responses || adGroupResponse.mutate_operation_responses.length === 0) {
        console.error('Invalid ad group response:', adGroupResponse)
        throw new Error('Failed to create ad group - invalid API response')
      }
      adGroupResult = adGroupResponse.mutate_operation_responses[0].ad_group_result
    } else if (adGroupResponse.results) {
      if (!adGroupResponse.results || adGroupResponse.results.length === 0) {
        console.error('Invalid ad group response:', adGroupResponse)
        throw new Error('Failed to create ad group - invalid API response')
      }
      adGroupResult = adGroupResponse.results[0]
    } else {
      console.error('Invalid ad group response:', adGroupResponse)
      throw new Error('Failed to create ad group - invalid API response')
    }
    
    const adGroupResourceName = adGroupResult.resource_name
    const adGroupId = adGroupResourceName.split('/')[3]
    console.log(`✅ Created ad group: ${adGroupId}`)

    // Step 4: Create Responsive Search Ad using mutateResources
    console.log('📝 Creating responsive search ad...')
    const responsiveSearchAd = {
      responsive_search_ad: {
        headlines: campaignData.headlines.map(text => ({ text })),
        descriptions: campaignData.descriptions.map(text => ({ text })),
        path1: campaignData.path1 || '',
        path2: campaignData.path2 || ''
      },
      final_urls: [campaignData.finalUrl],
      ...(campaignData.finalMobileUrl && {
        final_mobile_urls: [campaignData.finalMobileUrl]
      })
    }

    const adOperations = [
      {
        entity: "ad_group_ad",
        operation: "create",
        resource: {
          ad_group: adGroupResourceName,
          status: enums.AdGroupAdStatus.ENABLED,
          ad: responsiveSearchAd
        }
      }
    ]

    const adResponse = await customer.mutateResources(adOperations)
    
    // Handle both old and new response formats for ads
    let adResult
    if (adResponse.mutate_operation_responses) {
      if (!adResponse.mutate_operation_responses || adResponse.mutate_operation_responses.length === 0) {
        console.error('Invalid ad response:', adResponse)
        throw new Error('Failed to create responsive search ad - invalid API response')
      }
      adResult = adResponse.mutate_operation_responses[0].ad_group_ad_result
    } else if (adResponse.results) {
      if (!adResponse.results || adResponse.results.length === 0) {
        console.error('Invalid ad response:', adResponse)
        throw new Error('Failed to create responsive search ad - invalid API response')
      }
      adResult = adResponse.results[0]
    } else {
      console.error('Invalid ad response:', adResponse)
      throw new Error('Failed to create responsive search ad - invalid API response')
    }
    
    const adResourceName = adResult.resource_name
    const adId = adResourceName.split('/')[3]
    console.log(`✅ Created responsive search ad: ${adId}`)

    // Step 5: Add Keywords
    console.log('🔑 Adding keywords...')
    
    // Process keywords - handle both array of strings and comma-separated strings
    const processedKeywords: string[] = []
    campaignData.keywords.forEach(keyword => {
      if (keyword.includes(',')) {
        // Split comma-separated keywords
        const splitKeywords = keyword.split(',').map(k => k.trim()).filter(k => k.length > 0)
        processedKeywords.push(...splitKeywords)
      } else if (keyword.trim().length > 0) {
        processedKeywords.push(keyword.trim())
      }
    })
    
    console.log(`📝 Processed keywords:`, processedKeywords)
    
    const keywordOperations = processedKeywords.map(keyword => ({
      create: {
        ad_group: adGroupResourceName,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: {
          text: keyword,
          match_type: enums.KeywordMatchType.BROAD
        },
        cpc_bid_micros: campaignData.defaultBidMicros || 1000000,
      }
    }))

    if (keywordOperations.length > 0) {
      // Convert keyword operations to mutateResources format
      const keywordMutateOperations = keywordOperations.map(keywordOp => ({
        entity: "ad_group_criterion",
        operation: "create",
        resource: keywordOp.create
      }))
      
      const keywordsResponse = await customer.mutateResources(keywordMutateOperations)
      
      // Handle both old and new response formats for keywords
      let keywordResults
      if (keywordsResponse.mutate_operation_responses) {
        if (!keywordsResponse.mutate_operation_responses) {
          console.error('Invalid keywords response:', keywordsResponse)
          throw new Error('Failed to create keywords - invalid API response')
        }
        keywordResults = keywordsResponse.mutate_operation_responses.map(resp => resp.ad_group_criterion_result)
      } else if (keywordsResponse.results) {
        if (!keywordsResponse.results) {
          console.error('Invalid keywords response:', keywordsResponse)
          throw new Error('Failed to create keywords - invalid API response')
        }
        keywordResults = keywordsResponse.results
      } else {
        console.error('Invalid keywords response:', keywordsResponse)
        throw new Error('Failed to create keywords - invalid API response')
      }
      
      console.log(`✅ Added ${keywordResults.length} keywords`)
    } else {
      console.log('⚠️ No keywords to add')
    }

    // Step 6: Add Location Targeting (if specified)
    if (campaignData.locations && campaignData.locations.length > 0) {
      console.log('🌍 Adding location targeting...')
      const locationCriteriaMap: Record<string, number> = {
        'US': 2840, // United States
        'CA': 2124, // Canada
        'GB': 2826, // United Kingdom
        'AU': 2036, // Australia
        'DE': 2276, // Germany
        'FR': 2250  // France
      }

      const locationMutateOperations = campaignData.locations.map(location => ({
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          campaign: campaignResourceName,
          location: {
            geo_target_constant: `geoTargetConstants/${locationCriteriaMap[location] || 2840}`
          }
        }
      }))

      const locationResponse = await customer.mutateResources(locationMutateOperations)
      
      // Handle response format for location targeting
      let locationResults
      if (locationResponse.mutate_operation_responses) {
        locationResults = locationResponse.mutate_operation_responses.map(resp => resp.campaign_criterion_result)
      } else if (locationResponse.results) {
        locationResults = locationResponse.results
      } else {
        console.error('Invalid location targeting response:', locationResponse)
        throw new Error('Failed to create location targeting - invalid API response')
      }
      
      console.log(`✅ Added location targeting for: ${campaignData.locations.join(', ')}`)
    }

    // Step 7: Add Language Targeting (if specified)
    if (campaignData.languageCode) {
      console.log('🗣️ Adding language targeting...')
      const languageCriteriaMap: Record<string, number> = {
        'en': 1000, // English
        'es': 1003, // Spanish
        'fr': 1002, // French
        'de': 1001, // German
        'it': 1004  // Italian
      }

      const languageMutateOperations = [{
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          campaign: campaignResourceName,
          language: {
            language_constant: `languageConstants/${languageCriteriaMap[campaignData.languageCode] || 1000}`
          }
        }
      }]

      const languageResponse = await customer.mutateResources(languageMutateOperations)
      
      // Handle response format for language targeting
      let languageResults
      if (languageResponse.mutate_operation_responses) {
        languageResults = languageResponse.mutate_operation_responses.map(resp => resp.campaign_criterion_result)
      } else if (languageResponse.results) {
        languageResults = languageResponse.results
      } else {
        console.error('Invalid language targeting response:', languageResponse)
        throw new Error('Failed to create language targeting - invalid API response')
      }
      
      console.log(`✅ Added language targeting: ${campaignData.languageCode}`)
    }

    console.log('🎉 Campaign creation completed successfully!')
    return {
      success: true,
      campaignId,
      budgetId,
      adGroupId,
      adId
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