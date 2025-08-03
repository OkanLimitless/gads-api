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
        nameWithDate: `${campaignData.name} - ${new Date().toISOString().split('T')[0]}`,
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
    console.log('📊 Using Standard budget delivery method')
    
    // Prepare campaign resource
    // Append today's date to campaign name
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const campaignNameWithDate = `${campaignData.name} - ${today}`
    
    const campaignResource = {
      name: campaignNameWithDate,
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
              status: enums.CampaignStatus.ENABLED, // Start enabled and ready to run
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
          delivery_method: enums.BudgetDeliveryMethod.STANDARD, // Always use Standard for Search campaigns
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
    
    // Process keywords to determine match type and clean text
    const keywordOperations = processedKeywords.map(keyword => {
      let keywordText = keyword
      let matchType = enums.KeywordMatchType.BROAD // Default to broad match
      
      // Check for exact match keywords [keyword]
      if (keyword.startsWith('[') && keyword.endsWith(']')) {
        keywordText = keyword.slice(1, -1) // Remove brackets
        matchType = enums.KeywordMatchType.EXACT
      }
      // Check for phrase match keywords "keyword"
      else if (keyword.startsWith('"') && keyword.endsWith('"')) {
        keywordText = keyword.slice(1, -1) // Remove quotes
        matchType = enums.KeywordMatchType.PHRASE
      }
      // Otherwise it's broad match (default)
      
      console.log(`🎯 Keyword: "${keywordText}" - Match Type: ${matchType === enums.KeywordMatchType.EXACT ? 'EXACT' : matchType === enums.KeywordMatchType.PHRASE ? 'PHRASE' : 'BROAD'}`)
      
      return {
        create: {
          ad_group: adGroupResourceName,
          status: enums.AdGroupCriterionStatus.ENABLED,
          keyword: {
            text: keywordText,
            match_type: matchType
          },
          cpc_bid_micros: campaignData.defaultBidMicros || 1000000,
        }
      }
    })

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
        // Countries
        'US': 2840, // United States
        'CA': 2124, // Canada
        'GB': 2826, // United Kingdom
        'AU': 2036, // Australia
        'DE': 2276, // Germany
        'FR': 2250  // France
      }

      // Terminix targeting states (geo target constants)
      const terminixStates = {
        'CA': 21137, // California
        'NV': 21164, // Nevada
        'AZ': 21135, // Arizona
        'TX': 21176, // Texas
        'FL': 21149, // Florida
        'NY': 21167, // New York
        'IL': 21151, // Illinois
        'WA': 21179, // Washington
        'CO': 21138, // Colorado
        'GA': 21150, // Georgia
        'OR': 21168, // Oregon
        'MA': 21158, // Massachusetts
        'NJ': 21165, // New Jersey
        'MD': 21157, // Maryland
        'VA': 21178  // Virginia
      }

      let locationMutateOperations = []

      for (const location of campaignData.locations) {
        if (location === 'TERMINIX') {
          // Add all Terminix states
          console.log('🎯 Adding Terminix targeting (15 states)...')
          const terminixOperations = Object.values(terminixStates).map(geoId => ({
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              location: {
                geo_target_constant: `geoTargetConstants/${geoId}`
              }
            }
          }))
          locationMutateOperations.push(...terminixOperations)
        } else {
          // Regular country targeting
          locationMutateOperations.push({
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              location: {
                geo_target_constant: `geoTargetConstants/${locationCriteriaMap[location] || 2840}`
              }
            }
          })
        }
      }

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

    // Step 7: Add Device Targeting (Mobile Only)  
    if (campaignData.deviceTargeting === 'MOBILE_ONLY') {
      console.log('📱 Setting up mobile-only targeting...')
      
              try {
          // Create device bid modifiers - use bid_modifier: 0 to exclude devices (not -1.0)
          // Google Ads API doesn't support device exclusions, only bid adjustments
          const deviceBidModifierOperations = [
            {
              entity: "campaign_criterion",
              operation: "create",
              resource: {
                campaign: campaignResourceName,
                device: {
                  type: enums.Device.DESKTOP
                },
                bid_modifier: 0, // 0 = exclude device (shows as -100% in UI)
                status: enums.CampaignCriterionStatus.ENABLED
              }
            },
            {
              entity: "campaign_criterion", 
              operation: "create",
              resource: {
                campaign: campaignResourceName,
                device: {
                  type: enums.Device.TABLET
                },
                bid_modifier: 0, // 0 = exclude device (shows as -100% in UI)
                status: enums.CampaignCriterionStatus.ENABLED
              }
            }
          ]

          console.log('📊 Device bid modifier operations:', JSON.stringify(deviceBidModifierOperations, null, 2))
          const deviceResponse = await customer.mutateResources(deviceBidModifierOperations)
          console.log('✅ Set device targeting to mobile-only (bid_modifier: 0 for desktop and tablet)')
      } catch (error) {
        console.error('❌ Device targeting failed:', error)
        // Don't fail the entire campaign creation for device targeting issues
        console.log('⚠️ Continuing without device targeting...')
      }
    }

    // Step 8: Add Ad Scheduling
    if (campaignData.adScheduleTemplateId) {
      console.log('⏰ Setting up ad scheduling...')
      
      let adScheduleOperations = []

      // Handle built-in schedules
      if (campaignData.adScheduleTemplateId === 'est_business_hours') {
        console.log('📅 Using EST Business Hours schedule (9 AM - 9 PM EST)')
        // EST Business Hours: 00:00-03:00 and 15:00-23:59 UTC (covers 9 AM - 9 PM EST)
        const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        
        adScheduleOperations = daysOfWeek.flatMap(day => [
          // Early morning slot: 00:00-03:00 UTC (9 AM - 12 PM EST)
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              ad_schedule: {
                day_of_week: enums.DayOfWeek[day as keyof typeof enums.DayOfWeek],
                start_hour: 0,
                start_minute: enums.MinuteOfHour.ZERO,
                end_hour: 3,
                end_minute: enums.MinuteOfHour.ZERO
              }
            }
          },
          // Afternoon/evening slot: 15:00-23:59 UTC (12 PM - 9 PM EST)
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              ad_schedule: {
                day_of_week: enums.DayOfWeek[day as keyof typeof enums.DayOfWeek],
                start_hour: 15,
                start_minute: enums.MinuteOfHour.ZERO,
                end_hour: 23,
                end_minute: enums.MinuteOfHour.FORTY_FIVE
              }
            }
          }
        ])
      } 
      else if (campaignData.adScheduleTemplateId === 'amsterdam_evening_rush') {
        console.log('🌃 Using Amsterdam Evening Rush schedule (11 PM - 3 AM AMS)')
        // Amsterdam Evening Rush: 23:00-23:59 and 00:00-03:00 UTC
        const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        
        adScheduleOperations = daysOfWeek.flatMap(day => [
          // Late evening slot: 23:00-23:59 UTC (11 PM - 12 AM Amsterdam)
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              ad_schedule: {
                day_of_week: enums.DayOfWeek[day as keyof typeof enums.DayOfWeek],
                start_hour: 23,
                start_minute: enums.MinuteOfHour.ZERO,
                end_hour: 23,
                end_minute: enums.MinuteOfHour.FORTY_FIVE
              }
            }
          },
          // Early morning slot: 00:00-03:00 UTC (12 AM - 3 AM Amsterdam)
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResourceName,
              ad_schedule: {
                day_of_week: enums.DayOfWeek[day as keyof typeof enums.DayOfWeek],
                start_hour: 0,
                start_minute: enums.MinuteOfHour.ZERO,
                end_hour: 3,
                end_minute: enums.MinuteOfHour.ZERO
              }
            }
          }
        ])
      }
      else if (campaignData.adScheduleTemplateId === 'energie') {
        console.log('⚡ Using Energie schedule (10 AM - 8:30 PM, Monday-Friday)')
        // Energie Schedule: 10:00-20:30 Local Time (Netherlands/Europe timezone), Monday-Friday only
        // For Netherlands (UTC+1/UTC+2), this translates to 9:00-19:30 UTC (winter) or 8:00-18:30 UTC (summer)
        // Using UTC+1 (winter time) as base: 9:00-19:30 UTC
        const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] // Weekdays only
        
        adScheduleOperations = daysOfWeek.map(day => ({
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: campaignResourceName,
            ad_schedule: {
              day_of_week: enums.DayOfWeek[day as keyof typeof enums.DayOfWeek],
              start_hour: 9, // 10 AM local time (UTC+1)
              start_minute: enums.MinuteOfHour.ZERO,
              end_hour: 19, // 8:30 PM local time
              end_minute: enums.MinuteOfHour.THIRTY
            }
          }
        }))
      }
      // Handle custom templates
      else if (campaignData.adScheduleTemplate && campaignData.adScheduleTemplate.schedule.length > 0) {
        console.log('📋 Using custom ad schedule template')
        adScheduleOperations = campaignData.adScheduleTemplate.schedule.map(slot => ({
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: campaignResourceName,
            ad_schedule: {
              day_of_week: enums.DayOfWeek[slot.dayOfWeek as keyof typeof enums.DayOfWeek],
              start_hour: slot.startHour,
              start_minute: slot.startMinute === 0 ? enums.MinuteOfHour.ZERO :
                           slot.startMinute === 15 ? enums.MinuteOfHour.FIFTEEN :
                           slot.startMinute === 30 ? enums.MinuteOfHour.THIRTY :
                           enums.MinuteOfHour.FORTY_FIVE,
              end_hour: slot.endHour,
              end_minute: slot.endMinute === 0 ? enums.MinuteOfHour.ZERO :
                         slot.endMinute === 15 ? enums.MinuteOfHour.FIFTEEN :
                         slot.endMinute === 30 ? enums.MinuteOfHour.THIRTY :
                         enums.MinuteOfHour.FORTY_FIVE
            },
            bid_modifier: slot.bidModifier ? (slot.bidModifier / 100 + 1) : 1.0 // Convert percentage to multiplier
          }
        }))
      }

      if (adScheduleOperations.length > 0) {
        const scheduleResponse = await customer.mutateResources(adScheduleOperations)
        console.log(`✅ Added ${adScheduleOperations.length} ad schedule slots`)
      }
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
    console.log(`🔍 Fetching campaigns for customer ${customerId}`)
    
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId, // Required for accessing client accounts
    })

    // Use GAQL query instead of campaigns.list() for better compatibility
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.campaign_budget,
        campaign.bidding_strategy_type,
        campaign.start_date,
        campaign.end_date,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      ORDER BY campaign.id
    `

    console.log(`📊 Executing GAQL query for customer ${customerId}`)
    const campaigns = await customer.query(query)
    
    console.log(`✅ Found ${campaigns.length} campaigns for customer ${customerId}`)

    return campaigns.map((row: any) => {
      const campaign = row.campaign
      const campaignBudget = row.campaign_budget
      return {
        id: campaign.id?.toString() || '',
        name: campaign.name || '',
        status: campaign.status || 'UNKNOWN',
        budget: campaignBudget?.amount_micros ? parseInt(campaignBudget.amount_micros) / 1000000 : 0, // Convert micros to euros
        budgetId: campaign.campaign_budget || '',
        biddingStrategy: campaign.bidding_strategy_type || 'UNKNOWN',
        startDate: campaign.start_date || '',
        endDate: campaign.end_date,
        campaignType: campaign.advertising_channel_type || 'SEARCH',
      }
    })
  } catch (error) {
    console.error(`💥 Error fetching campaigns for customer ${customerId}:`, error)
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`)
      console.error(`Error stack: ${error.stack}`)
    }
    
    throw new Error(`Failed to fetch campaigns for customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

// Dummy Campaign Creation Function
export async function createDummyCampaign(
  customerId: string,
  refreshToken: string,
  templateData: {
    name: string
    finalUrl: string
    finalMobileUrl?: string
    path1?: string
    path2?: string
    headlines: string[]
    descriptions: string[]
    keywords: string[]
    budgetAmountMicros: number
    biddingStrategy: string
    targetCpa?: number
    targetRoas?: number
    locations?: string[]
    languageCode?: string
    adGroupName: string
  }
): Promise<{ success: boolean; campaignId?: string; budgetId?: string; adGroupId?: string; adId?: string; error?: string }> {
  try {
    console.log(`🎯 Creating dummy campaign for customer ${customerId}:`, {
      name: templateData.name,
      budgetAmountMicros: templateData.budgetAmountMicros,
      biddingStrategy: templateData.biddingStrategy,
      finalUrl: templateData.finalUrl,
      headlines: templateData.headlines.length,
      descriptions: templateData.descriptions.length,
      keywords: templateData.keywords.length
    })
    
    // Append today's date to campaign name (consistent with regular campaigns)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const campaignNameWithDate = `${templateData.name} - ${today}`
    
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId,
    })
    
    console.log(`🔑 Using MCC ${knownMCCId} as login customer for client ${customerId}`)

    // Import required modules for atomic operations
    const { resources, enums, ResourceNames } = require('google-ads-api')
    
    // Create a resource name with a temporary resource id (-1)
    const budgetResourceName = ResourceNames.campaignBudget(customerId, "-1")
    
    console.log('💰 Creating dummy campaign budget and campaign atomically...')
    
    // Prepare campaign resource
    const campaignResource = {
      name: campaignNameWithDate,
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
      status: enums.CampaignStatus.ENABLED,
      campaign_budget: budgetResourceName,
      start_date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
      network_settings: {
        target_google_search: true,
        target_search_network: false,
        target_content_network: false,
        target_partner_search_network: false,
      }
    }

    // Add bidding strategy
    if (templateData.biddingStrategy === 'TARGET_CPA' && templateData.targetCpa) {
      campaignResource.target_cpa = {
        target_cpa_micros: templateData.targetCpa
      }
    } else if (templateData.biddingStrategy === 'TARGET_ROAS' && templateData.targetRoas) {
      campaignResource.target_roas = {
        target_roas: templateData.targetRoas
      }
    } else if (templateData.biddingStrategy === 'MAXIMIZE_CONVERSIONS') {
      campaignResource.maximize_conversions = {}
    } else if (templateData.biddingStrategy === 'MAXIMIZE_CONVERSION_VALUE') {
      campaignResource.maximize_conversion_value = {}
    } else {
      campaignResource.manual_cpc = {
        enhanced_cpc_enabled: templateData.biddingStrategy === 'ENHANCED_CPC'
      }
    }
    
    const operations = [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetResourceName,
          amount_micros: templateData.budgetAmountMicros,
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

    console.log('📊 Dummy campaign operations to execute:', JSON.stringify(operations, null, 2))
    const response = await customer.mutateResources(operations)
    console.log('📋 Dummy campaign API Response:', JSON.stringify(response, null, 2))
    
    // Handle different response formats - Updated for mutate_operation_responses
    let campaignResult, budgetResult, campaignId, campaignResourceName, budgetId
    
    if (response?.mutate_operation_responses) {
      console.log('📋 Response has mutate_operation_responses, length:', response.mutate_operation_responses.length)
      campaignResult = response.mutate_operation_responses.find((result: any) => result?.campaign_result)
      budgetResult = response.mutate_operation_responses.find((result: any) => result?.campaign_budget_result)
      
      if (campaignResult?.campaign_result) {
        campaignId = campaignResult.campaign_result.resource_name?.split('/')[3]
        campaignResourceName = campaignResult.campaign_result.resource_name
      }
      
      if (budgetResult?.campaign_budget_result) {
        budgetId = budgetResult.campaign_budget_result.resource_name?.split('/')[3]
      }
    } else if (Array.isArray(response)) {
      console.log('📋 Response is array, length:', response.length)
      campaignResult = response.find((result: any) => result?.campaign)
      budgetResult = response.find((result: any) => result?.campaign_budget)
      
      if (campaignResult?.campaign) {
        campaignId = campaignResult.campaign.resource_name?.split('/')[3]
        campaignResourceName = campaignResult.campaign.resource_name
      }
      
      if (budgetResult?.campaign_budget) {
        budgetId = budgetResult.campaign_budget.resource_name?.split('/')[3]
      }
    } else if (response?.results) {
      console.log('📋 Response has results array, length:', response.results.length)
      campaignResult = response.results.find((result: any) => result?.campaign)
      budgetResult = response.results.find((result: any) => result?.campaign_budget)
      
      if (campaignResult?.campaign) {
        campaignId = campaignResult.campaign.resource_name?.split('/')[3]
        campaignResourceName = campaignResult.campaign.resource_name
      }
      
      if (budgetResult?.campaign_budget) {
        budgetId = budgetResult.campaign_budget.resource_name?.split('/')[3]
      }
    } else if (response?.campaign) {
      console.log('📋 Response has direct campaign')
      campaignId = response.campaign.resource_name?.split('/')[3]
      campaignResourceName = response.campaign.resource_name
      budgetId = response.campaign_budget?.resource_name?.split('/')[3]
    }
    
    if (!campaignId) {
      console.error('❌ No campaign ID found in response structure:', response)
      console.error('❌ Checked campaignResult:', campaignResult)
      console.error('❌ Checked budgetResult:', budgetResult)
      throw new Error('Campaign creation failed - no campaign ID in response')
    }
    

    
    console.log('✅ Dummy campaign created successfully:', {
      campaignId,
      budgetId,
      campaignResourceName
    })
    
    // Track the dummy campaign in MongoDB for performance monitoring
    try {
      const { trackDummyCampaign } = await import('./dummy-campaign-tracker')
      await trackDummyCampaign({
        accountId: customerId,
        campaignId,
        campaignName: campaignNameWithDate,
        budgetId,
        templateName: templateData.name
      })
    } catch (trackingError) {
      console.error('💥 Error tracking dummy campaign:', trackingError)
      // Don't fail the entire process for tracking errors
    }
    
    // Step 2: Create Ad Group
    console.log('📁 Creating ad group for dummy campaign...')
    const adGroupResourceName = ResourceNames.adGroup(customerId, "-1")
    
    const adGroupOperations = [
      {
        entity: "ad_group",
        operation: "create",
        resource: {
          resource_name: adGroupResourceName,
          name: templateData.adGroupName,
          campaign: campaignResourceName,
          status: enums.AdGroupStatus.ENABLED,
          type: enums.AdGroupType.SEARCH_STANDARD,
          cpc_bid_micros: 1000000, // $1 default bid
        },
      },
    ]
    
    const adGroupResponse = await customer.mutateResources(adGroupOperations)
    console.log('📋 Ad group creation response:', JSON.stringify(adGroupResponse, null, 2))
    
    // Handle ad group response format - Updated for mutate_operation_responses
    let adGroupResult, adGroupId, adGroupResourceNameFinal
    
    if (adGroupResponse?.mutate_operation_responses) {
      console.log('📋 Ad group response has mutate_operation_responses')
      adGroupResult = adGroupResponse.mutate_operation_responses.find((result: any) => result?.ad_group_result)
      
      if (adGroupResult?.ad_group_result) {
        adGroupId = adGroupResult.ad_group_result.resource_name?.split('/')[3]
        adGroupResourceNameFinal = adGroupResult.ad_group_result.resource_name
      }
    } else if (Array.isArray(adGroupResponse)) {
      adGroupResult = adGroupResponse[0]
      if (adGroupResult?.ad_group) {
        adGroupId = adGroupResult.ad_group.resource_name.split('/')[3]
        adGroupResourceNameFinal = adGroupResult.ad_group.resource_name
      }
    } else if (adGroupResponse?.results) {
      adGroupResult = adGroupResponse.results[0]
      if (adGroupResult?.ad_group) {
        adGroupId = adGroupResult.ad_group.resource_name.split('/')[3]
        adGroupResourceNameFinal = adGroupResult.ad_group.resource_name
      }
    } else if (adGroupResponse?.ad_group) {
      adGroupId = adGroupResponse.ad_group.resource_name.split('/')[3]
      adGroupResourceNameFinal = adGroupResponse.ad_group.resource_name
    }
    
    if (!adGroupId) {
      console.error('❌ No ad group ID found in response:', adGroupResponse)
      console.error('❌ Checked adGroupResult:', adGroupResult)
      throw new Error('Ad group creation failed - no ad group ID in response')
    }
    
    console.log('✅ Ad group created:', { adGroupId })
    
    // Step 3: Create Keywords
    console.log('🔑 Creating keywords for dummy campaign...')
    const keywordOperations = templateData.keywords.map((keyword, index) => ({
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        resource_name: ResourceNames.adGroupCriterion(customerId, adGroupId, `-${index + 1}`),
        ad_group: adGroupResourceNameFinal,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: {
          text: keyword,
          match_type: enums.KeywordMatchType.BROAD,
        },
        cpc_bid_micros: 1000000, // $1 bid per keyword
      },
    }))
    
    if (keywordOperations.length > 0) {
      try {
        const keywordResponse = await customer.mutateResources(keywordOperations)
        console.log('📋 Keyword creation response:', JSON.stringify(keywordResponse, null, 2))
        
        // Check if keywords were created successfully - Updated for mutate_operation_responses
        let keywordResults
        if (keywordResponse?.mutate_operation_responses) {
          keywordResults = keywordResponse.mutate_operation_responses.filter((result: any) => result?.ad_group_criterion_result)
        } else if (Array.isArray(keywordResponse)) {
          keywordResults = keywordResponse.filter((result: any) => result?.ad_group_criterion)
        } else if (keywordResponse?.results) {
          keywordResults = keywordResponse.results.filter((result: any) => result?.ad_group_criterion)
        } else {
          keywordResults = [keywordResponse].filter((result: any) => result?.ad_group_criterion)
        }
        
        const successfulKeywords = keywordResults
        
        console.log(`✅ Created ${successfulKeywords.length}/${keywordOperations.length} keywords`)
      } catch (keywordError) {
        console.error('💥 Error creating keywords:', keywordError)
        // Continue without failing the entire campaign creation
      }
    }
    
    // Step 4: Create Responsive Search Ad
    console.log('📝 Creating responsive search ad for dummy campaign...')
    
    // Ensure we have the right number of headlines and descriptions
    const finalHeadlines = templateData.headlines.slice(0, 15) // Max 15 headlines
    const finalDescriptions = templateData.descriptions.slice(0, 4) // Max 4 descriptions
    
    // Ensure minimum requirements
    if (finalHeadlines.length < 3) {
      throw new Error('At least 3 headlines are required for responsive search ads')
    }
    if (finalDescriptions.length < 2) {
      throw new Error('At least 2 descriptions are required for responsive search ads')
    }
    
    const adOperations = [
      {
        entity: "ad_group_ad",
        operation: "create",
        resource: {
          resource_name: ResourceNames.adGroupAd(customerId, adGroupId, "-1"),
          ad_group: adGroupResourceNameFinal,
          status: enums.AdGroupAdStatus.ENABLED,
          ad: {
            final_urls: [templateData.finalUrl],
            final_mobile_urls: templateData.finalMobileUrl ? [templateData.finalMobileUrl] : undefined,
            path1: templateData.path1,
            path2: templateData.path2,
            responsive_search_ad: {
              headlines: finalHeadlines.map((headline, index) => ({
                text: headline,
                pinned_field: index < 3 ? undefined : undefined, // Don't pin any headlines
              })),
              descriptions: finalDescriptions.map((description) => ({
                text: description,
              })),
            },
          },
        },
      },
    ]
    
          try {
        const adResponse = await customer.mutateResources(adOperations)
        console.log('📋 Ad creation response:', JSON.stringify(adResponse, null, 2))
        
        // Handle ad response format - Updated for mutate_operation_responses
        let adResult, adId
        
        if (adResponse?.mutate_operation_responses) {
          console.log('📋 Ad response has mutate_operation_responses')
          adResult = adResponse.mutate_operation_responses.find((result: any) => result?.ad_group_ad_result)
          
          if (adResult?.ad_group_ad_result) {
            adId = adResult.ad_group_ad_result.resource_name?.split('/')[5]
          }
        } else if (Array.isArray(adResponse)) {
          adResult = adResponse[0]
          if (adResult?.ad_group_ad) {
            adId = adResult.ad_group_ad.resource_name?.split('/')[5]
          }
        } else if (adResponse?.results) {
          adResult = adResponse.results[0]
          if (adResult?.ad_group_ad) {
            adId = adResult.ad_group_ad.resource_name?.split('/')[5]
          }
        } else if (adResponse?.ad_group_ad) {
          adId = adResponse.ad_group_ad.resource_name?.split('/')[5]
        }
        
        if (!adId) {
          console.error('❌ No ad ID found in response:', adResponse)
          console.error('❌ Checked adResult:', adResult)
          adId = 'failed'
        } else {
          console.log('✅ Responsive search ad created:', { adId })
        }
      } catch (adError) {
        console.error('💥 Error creating responsive search ad:', adError)
        // Continue without failing the entire campaign creation
        var adId = 'failed'
      }
    
    // Step 5: Add location targeting if specified
    if (templateData.locations && templateData.locations.length > 0) {
      console.log('🌍 Adding location targeting...')
      const locationOperations = templateData.locations.map((locationId, index) => ({
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          resource_name: ResourceNames.campaignCriterion(customerId, campaignId, `-${index + 1}`),
          campaign: campaignResourceName,
          location: {
            geo_target_constant: ResourceNames.geoTargetConstant(locationId),
          },
          bid_modifier: 1.0,
        },
      }))
      
      try {
        const locationResponse = await customer.mutateResources(locationOperations)
        console.log(`✅ Added ${locationOperations.length} location targets`)
        console.log('📋 Location targeting response:', JSON.stringify(locationResponse, null, 2))
      } catch (locationError) {
        console.error('💥 Error adding location targeting:', locationError)
        // Continue without failing the entire campaign creation
      }
    }
    
    // Step 6: Add language targeting if specified
    if (templateData.languageCode) {
      console.log('🗣️ Adding language targeting...')
      
      // Language constants: English = 1000, Dutch = 1019
      const languageConstantId = templateData.languageCode === 'nl' ? '1019' : '1000'
      
      const languageOperations = [
        {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            resource_name: ResourceNames.campaignCriterion(customerId, campaignId, "-100"),
            campaign: campaignResourceName,
            language: {
              language_constant: ResourceNames.languageConstant(languageConstantId),
            },
          },
        },
      ]
      
      try {
        const languageResponse = await customer.mutateResources(languageOperations)
        console.log(`✅ Added language targeting: ${templateData.languageCode} (${languageConstantId})`)
        console.log('📋 Language targeting response:', JSON.stringify(languageResponse, null, 2))
      } catch (languageError) {
        console.error('💥 Error adding language targeting:', languageError)
        // Continue without failing the entire campaign creation
      }
    }
    
    console.log('🎉 Dummy campaign creation completed successfully!')
    
    return {
      success: true,
      campaignId,
      budgetId,
      adGroupId,
      adId
    }
    
  } catch (error) {
    console.error('💥 Error creating dummy campaign:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Simplified function to get just campaign count for debugging
export async function getCampaignCount(customerId: string, refreshToken: string): Promise<number> {
  try {
    console.log(`🔢 Getting campaign count for customer ${customerId}`)
    
    // Use MCC account as login customer for client account access
    const knownMCCId = '1284928552'
    const customer = googleAdsClient.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
      login_customer_id: knownMCCId,
    })

    // Simplified query to just count campaigns
    const query = `
      SELECT campaign.id
      FROM campaign
      LIMIT 1000
    `

    console.log(`📊 Executing simplified count query for customer ${customerId}`)
    const campaigns = await customer.query(query)
    
    const count = campaigns.length
    console.log(`✅ Customer ${customerId} has ${count} campaigns`)
    
    return count
  } catch (error) {
    console.error(`💥 Error getting campaign count for customer ${customerId}:`, error)
    
    // Try an even simpler approach - just check if we can access the account
    try {
      console.log(`🔄 Trying alternative approach for customer ${customerId}`)
      const customer = googleAdsClient.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: '1284928552',
      })
      
      // Try to get customer info to test access
      const customerQuery = `
        SELECT customer.id
        FROM customer
        LIMIT 1
      `
      
      await customer.query(customerQuery)
      console.log(`✅ Customer ${customerId} is accessible, assuming 0 campaigns due to query limitations`)
      return 0 // If we can access but can't get campaigns, assume 0 for now
      
    } catch (fallbackError) {
      console.error(`💥 Fallback also failed for customer ${customerId}:`, fallbackError)
      throw new Error(`Cannot access customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export async function getClientAccounts(mccId: string, refreshToken: string): Promise<{
  id: string
  name: string
  descriptive_name?: string
  currency_code?: string
  time_zone?: string
  testAccount?: boolean
}[]> {
  try {
    console.log(`🏢 Fetching client accounts for MCC: ${mccId}`)

    // Hidden account IDs that should be excluded from selection
    const hiddenAccountIds = [
      '7543640452', '1981739507', '2455272543', 
      '2943276700', '5353988239', '5299881560', '6575141691'
    ]

    // Create customer client for the MCC account
    const mccCustomerClient = googleAdsClient.Customer({
      customer_id: mccId,
      refresh_token: refreshToken,
    })

    // Query customer clients managed by this MCC
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

    console.log(`📊 Querying client accounts for MCC ${mccId}...`)
    const clientsResponse = await mccCustomerClient.query(clientsQuery)

    console.log(`✅ Found ${clientsResponse.length} client accounts`)

    // Transform the response
    const clientAccounts = clientsResponse.map((item: any) => {
      const client = item.customer_client
      const clientId = client.client_customer?.split('/')[1] || 'unknown'
      
      return {
        id: clientId,
        name: client.descriptive_name || `Client Account ${clientId}`,
        descriptive_name: client.descriptive_name,
        currency_code: client.currency_code || 'EUR',
        time_zone: client.time_zone || 'Europe/Amsterdam',
        testAccount: client.test_account || false,
      }
    })

    // Filter out hidden accounts
    const visibleClientAccounts = clientAccounts.filter(account => 
      !hiddenAccountIds.includes(account.id)
    )
    
    console.log(`🎯 Returning ${visibleClientAccounts.length} visible client accounts for MCC ${mccId}`)
    return visibleClientAccounts

  } catch (error) {
    console.error('💥 Error fetching MCC client accounts:', error)
    throw new Error(`Failed to fetch client accounts for MCC ${mccId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}