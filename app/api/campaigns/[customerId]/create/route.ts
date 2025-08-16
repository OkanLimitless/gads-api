import { NextRequest, NextResponse } from 'next/server'
import { createCampaign, monitorAndUpdateFinalUrl } from '@/lib/google-ads-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { campaignData, autoUrlSwap, autoSwapNewUrl } = await request.json()
    const customerId = params.customerId

    console.log(`📝 Creating campaign for customer ${customerId}:`, {
      name: campaignData.name,
      budget: campaignData.budgetAmountMicros,
      finalUrl: campaignData.finalUrl,
      headlines: campaignData.headlines?.length,
      descriptions: campaignData.descriptions?.length,
      keywords: campaignData.keywords?.length,
      autoUrlSwap: !!autoUrlSwap,
      hasAutoSwapUrl: !!autoSwapNewUrl,
    })
    
    console.log(`🔍 Debug: languageCode in API = '${campaignData.languageCode}'`)

    // Validate required fields
    if (!campaignData.name || !campaignData.finalUrl || !campaignData.adGroupName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, finalUrl, or adGroupName' },
        { status: 400 }
      )
    }

    if (!campaignData.headlines || campaignData.headlines.length < 3) {
      return NextResponse.json(
        { success: false, error: 'At least 3 headlines are required' },
        { status: 400 }
      )
    }

    if (!campaignData.descriptions || campaignData.descriptions.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 descriptions are required' },
        { status: 400 }
      )
    }

    if (!campaignData.keywords || campaignData.keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least 1 keyword is required' },
        { status: 400 }
      )
    }

    // Create the campaign
    const result = await createCampaign(
      customerId,
      session.refreshToken,
      campaignData
    )

    if (result.success) {
      console.log(`✅ Campaign created successfully:`, {
        campaignId: result.campaignId,
        budgetId: result.budgetId,
        adGroupId: result.adGroupId,
        adId: result.adId
      })

      // Background: monitor approval and update final_urls if requested
      if (autoUrlSwap && autoSwapNewUrl && result.adGroupId && result.adId) {
        // Fire-and-forget; do not await to keep response fast
        monitorAndUpdateFinalUrl(customerId, session.refreshToken, result.adGroupId, result.adId, autoSwapNewUrl)
          .catch(err => console.error('Auto URL swap monitor error:', err))
      }

      // Create the same date-appended name that was used in the backend
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const campaignNameWithDate = `${campaignData.name} - ${today}`
      
      return NextResponse.json({
        success: true,
        message: `Campaign "${campaignNameWithDate}" created successfully!`,
        campaignId: result.campaignId,
        budgetId: result.budgetId,
        adGroupId: result.adGroupId,
        adId: result.adId,
        autoUrlSwapStarted: !!(autoUrlSwap && autoSwapNewUrl && result.adGroupId && result.adId)
      })
    } else {
      console.error(`❌ Campaign creation failed:`, result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 Error in campaign creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}