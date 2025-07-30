import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { createDummyCampaign } from '@/lib/google-ads-client'

import { getRandomTemplate } from '../../template-manager/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Dummy Campaign Creation API called')
    const session = await getServerSession(authOptions)

    if (!session || !session.refreshToken) {
      console.log('❌ No session or refresh token')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { accountId, templateId, useRandomTemplate, customizations } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing required field: accountId' },
        { status: 400 }
      )
    }

    console.log(`🎯 Creating dummy campaign for account ${accountId}`)

    // Get the template (random or specific)
    let template
    if (useRandomTemplate) {
      console.log('🎲 Using random template selection')
      template = await getRandomTemplate()
      if (!template) {
        return NextResponse.json(
          { error: 'No templates available for random selection. Please create templates first.' },
          { status: 404 }
        )
      }
      console.log(`🎲 Selected random template: ${template.name}`)
    } else {
      if (!templateId) {
        return NextResponse.json(
          { error: 'Missing required field: templateId (when not using random)' },
          { status: 400 }
        )
      }
      template = getTemplateById(templateId)
      if (!template) {
        return NextResponse.json(
          { error: `Template with ID ${templateId} not found` },
          { status: 404 }
        )
      }
      console.log(`📋 Using specified template: ${template.name}`)
    }

    // Prepare template data for campaign creation
    const customizedTemplate = {
      id: template._id || 'random',
      name: `${template.name} - Account-${accountId}`,
      description: template.description,
      budgetAmountMicros: 3000000, // €3 daily budget
      biddingStrategy: 'MAXIMIZE_CLICKS' as const,
      locations: ['2528'], // Netherlands
      languageCode: 'nl',
      adGroupName: `${template.adGroupName || 'Default Ad Group'} - Account-${accountId}`,
      finalUrl: template.finalUrl,
      finalMobileUrl: template.finalMobileUrl,
      path1: template.path1,
      path2: template.path2,
      headlines: template.headlines,
      descriptions: template.descriptions,
      keywords: template.keywords
    }

    console.log(`📋 Using template: ${template.name}`)
    console.log(`🔧 Customized for account: ${accountId}`)

    // Create the dummy campaign
    const result = await createDummyCampaign(
      accountId,
      session.refreshToken,
      {
        name: customizedTemplate.name,
        finalUrl: customizedTemplate.finalUrl,
        finalMobileUrl: customizedTemplate.finalMobileUrl,
        path1: customizedTemplate.path1,
        path2: customizedTemplate.path2,
        headlines: customizedTemplate.headlines,
        descriptions: customizedTemplate.descriptions,
        keywords: customizedTemplate.keywords,
        budgetAmountMicros: customizedTemplate.budgetAmountMicros,
        biddingStrategy: customizedTemplate.biddingStrategy,
        targetCpa: customizedTemplate.targetCpa,
        targetRoas: customizedTemplate.targetRoas,
        locations: customizedTemplate.locations,
        languageCode: customizedTemplate.languageCode,
        adGroupName: customizedTemplate.adGroupName
      }
    )

    if (result.success) {
      console.log(`✅ Dummy campaign created successfully for account ${accountId}:`, {
        campaignId: result.campaignId,
        budgetId: result.budgetId,
        adGroupId: result.adGroupId,
        adId: result.adId
      })

      // Create the same date-appended name that was used in the backend
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const campaignNameWithDate = `${customizedTemplate.name} - ${today}`

      return NextResponse.json({
        success: true,
        message: `Dummy campaign "${campaignNameWithDate}" created successfully for account ${accountId}!`,
        accountId,
        templateUsed: template.name,
        campaignId: result.campaignId,
        budgetId: result.budgetId,
        adGroupId: result.adGroupId,
        adId: result.adId,
        campaignDetails: {
          name: campaignNameWithDate,
          budget: customizedTemplate.budgetAmountMicros / 1000000, // Convert back to dollars
          keywords: customizedTemplate.keywords.length,
          headlines: customizedTemplate.headlines.length,
          descriptions: customizedTemplate.descriptions.length
        }
      })
    } else {
      console.error(`❌ Dummy campaign creation failed for account ${accountId}:`, result.error)
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          accountId,
          templateUsed: template.name
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('💥 Error in dummy campaign creation API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}