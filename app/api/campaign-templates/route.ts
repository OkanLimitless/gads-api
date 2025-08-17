import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { ObjectId } from 'mongodb'
import getMongoClientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getCampaignTemplatesCollection() {
  const client = await getMongoClientPromise()
  const db = client.db('google_ads_manager')
  return db.collection('campaign_templates') // Different collection from dummy templates
}

export interface RealCampaignTemplate {
  _id?: string
  name: string
  description: string
  category: 'NL' | 'US' // Template category
  data: {
    budget: number
    finalUrl: string
    path1?: string
    path2?: string
    headlines: string[]
    descriptions: string[]
    keywords: string[]
    locations: string[]
    languageCode: string
    adScheduleTemplateId?: string
    deviceTargeting: 'ALL' | 'MOBILE_ONLY'
  }
  createdAt: string
  updatedAt: string
}

// GET - Fetch all real campaign templates
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching real campaign templates from MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // Optional category filter

    const collection = await getCampaignTemplatesCollection()
    const query = category ? { category } : {}
    const templates = await collection.find(query).sort({ category: 1, createdAt: -1 }).toArray()
    
    // Convert ObjectId to string for JSON serialization
    const serializedTemplates = templates.map(template => ({
      ...template,
      _id: template._id.toString()
    }))
    
    console.log(`✅ Returning ${serializedTemplates.length} real campaign templates${category ? ` (category: ${category})` : ''} from MongoDB`)
    
    return NextResponse.json({
      success: true,
      templates: serializedTemplates,
      totalTemplates: serializedTemplates.length,
      categories: ['NL', 'US']
    })

  } catch (error) {
    console.error('💥 Error fetching real campaign templates:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// POST - Create, update, or duplicate real campaign template
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving real campaign template to MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const collection = await getCampaignTemplatesCollection()

    // Duplicate action
    if (action === 'duplicate') {
      const id = searchParams.get('id')
      if (!id) {
        return NextResponse.json({ success: false, error: 'Template ID is required for duplication' }, { status: 400 })
      }

      let source
      try {
        if (id.length === 24) {
          source = await collection.findOne({ _id: new ObjectId(id) })
        } else {
          source = await collection.findOne({ _id: id })
        }
      } catch (e) {
        source = await collection.findOne({ _id: id })
      }

      if (!source) {
        return NextResponse.json({ success: false, error: 'Template to duplicate not found' }, { status: 404 })
      }

      const now = new Date().toISOString()
      const duplicateDoc: any = {
        ...source,
        _id: undefined,
        name: `${source.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
      }
      duplicateDoc.data = {
        ...source.data,
        headlines: [...(source.data?.headlines || [])],
        descriptions: [...(source.data?.descriptions || [])],
        keywords: [...(source.data?.keywords || [])],
        locations: [...(source.data?.locations || [])],
      }

      const insertRes = await collection.insertOne(duplicateDoc)
      return NextResponse.json({ success: true, message: 'Template duplicated successfully', templateId: insertRes.insertedId.toString() })
    }

    const templateData = await request.json()
    
    // Validate required fields
    if (!templateData.name || !templateData.category || !templateData.data) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: name, category, and data are required' 
        },
        { status: 400 }
      )
    }

    // Validate category
    if (!['NL', 'US'].includes(templateData.category)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid category. Must be "NL" or "US"' 
        },
        { status: 400 }
      )
    }

    // Validate template data
    const { data } = templateData
    if (!data.finalUrl || !data.headlines || data.headlines.length < 3 ||
        !data.descriptions || data.descriptions.length < 2 ||
        !data.keywords || data.keywords.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid template data: finalUrl, at least 3 headlines, 2 descriptions, and keywords are required' 
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    
    let result
    let isUpdate = false
    
    // Check if template exists (update) or create new
    if (templateData._id) {
      let existingTemplate
      let filterId: any = templateData._id
      try {
        if (typeof templateData._id === 'string' && templateData._id.length === 24) {
          existingTemplate = await collection.findOne({ _id: new ObjectId(templateData._id) })
          filterId = new ObjectId(templateData._id)
        } else {
          existingTemplate = await collection.findOne({ _id: templateData._id })
          filterId = templateData._id
        }
      } catch (error) {
        existingTemplate = await collection.findOne({ _id: templateData._id })
        filterId = templateData._id
      }
      
      if (existingTemplate) {
        isUpdate = true
        const updatedTemplate = {
          ...templateData,
          _id: filterId,
          createdAt: existingTemplate.createdAt,
          updatedAt: now
        }
        
        result = await collection.replaceOne(
          { _id: filterId },
          updatedTemplate
        )
        
        console.log(`✅ Updated real campaign template: ${templateData.name} (${templateData.category})`)
      }
    }
    
    if (!isUpdate) {
      // Create new template
      const newTemplate = {
        ...templateData,
        createdAt: now,
        updatedAt: now
      }
      
      // Remove _id if it exists (let MongoDB generate it)
      delete newTemplate._id
      
      result = await collection.insertOne(newTemplate)
      console.log(`✅ Created new real campaign template: ${templateData.name} (${templateData.category})`)
    }

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Template updated successfully' : 'Template created successfully',
      templateId: isUpdate ? templateData._id : result.insertedId.toString(),
      category: templateData.category
    })
    
  } catch (error) {
    console.error('💥 Error saving real campaign template to MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete real campaign template
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting real campaign template from MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const collection = await getCampaignTemplatesCollection()
    
    // Try to delete using the provided templateId (could be ObjectId or string)
    let result
    try {
      // First try as ObjectId (24-char hex)
      if (typeof templateId === 'string' && templateId.length === 24) {
        result = await collection.deleteOne({ _id: new ObjectId(templateId) })
      } else {
        // Use as string ID for longer hex strings or other formats
        result = await collection.deleteOne({ _id: templateId })
      }
    } catch (error) {
      // If ObjectId conversion fails, try as string
      result = await collection.deleteOne({ _id: templateId })
    }
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Deleted real campaign template: ${templateId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
    
  } catch (error) {
    console.error('💥 Error deleting real campaign template from MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}