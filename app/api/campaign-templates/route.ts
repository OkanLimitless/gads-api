import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { MongoClient, ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI!)

async function getCampaignTemplatesCollection() {
  await client.connect()
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

// POST - Create or update real campaign template
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving real campaign template to MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
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

    const collection = await getCampaignTemplatesCollection()
    const now = new Date().toISOString()
    
    let result
    let isUpdate = false
    
    // Check if template exists (update) or create new
    if (templateData._id) {
      try {
        const existingTemplate = await collection.findOne({ _id: templateData._id })
        
        if (existingTemplate) {
          isUpdate = true
          const updatedTemplate = {
            ...templateData,
            _id: templateData._id,
            createdAt: existingTemplate.createdAt,
            updatedAt: now
          }
          
          result = await collection.replaceOne(
            { _id: templateData._id },
            updatedTemplate
          )
          
          console.log(`✅ Updated real campaign template: ${templateData.name} (${templateData.category})`)
        }
      } catch (error) {
        // If ObjectId conversion fails, try as string
        const existingTemplate = await collection.findOne({ _id: templateData._id })
        
        if (existingTemplate) {
          isUpdate = true
          const updatedTemplate = {
            ...templateData,
            _id: templateData._id,
            createdAt: existingTemplate.createdAt,
            updatedAt: now
          }
          
          result = await collection.replaceOne(
            { _id: templateData._id },
            updatedTemplate
          )
          
          console.log(`✅ Updated real campaign template: ${templateData.name} (${templateData.category})`)
        }
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