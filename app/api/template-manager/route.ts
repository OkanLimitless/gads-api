import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getTemplatesCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TemplateData {
  _id?: ObjectId | string
  name: string
  description: string
  finalUrl: string
  finalMobileUrl?: string
  path1?: string
  path2?: string
  headlines: string[]
  descriptions: string[]
  keywords: string[]
  adGroupName: string
  createdAt: string
  updatedAt: string
}

// GET - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching campaign templates from MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const collection = await getTemplatesCollection()
    const templates = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    // Convert ObjectId to string for JSON serialization
    const serializedTemplates = templates.map(template => ({
      ...template,
      _id: template._id.toString()
    }))
    
    console.log(`✅ Returning ${serializedTemplates.length} templates from MongoDB`)
    
    return NextResponse.json({
      success: true,
      templates: serializedTemplates,
      totalTemplates: serializedTemplates.length
    })
    
  } catch (error) {
    console.error('💥 Error fetching templates from MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// POST - Create or update template
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving campaign template to MongoDB')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const templateData = await request.json()
    
    // Validate required fields
    if (!templateData.name || !templateData.finalUrl || 
        !templateData.headlines || templateData.headlines.length < 3 ||
        !templateData.descriptions || templateData.descriptions.length < 2 ||
        !templateData.keywords || templateData.keywords.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: name, finalUrl, at least 3 headlines, 2 descriptions, and keywords' 
        },
        { status: 400 }
      )
    }

    const collection = await getTemplatesCollection()
    const now = new Date().toISOString()
    
    let result
    let isUpdate = false
    
    // Check if template exists (update) or create new
    if (templateData._id) {
      // Update existing template
      const existingTemplate = await collection.findOne({ _id: new ObjectId(templateData._id) })
      
      if (existingTemplate) {
        isUpdate = true
        const updatedTemplate = {
          ...templateData,
          _id: new ObjectId(templateData._id),
          createdAt: existingTemplate.createdAt,
          updatedAt: now
        }
        
        result = await collection.replaceOne(
          { _id: new ObjectId(templateData._id) },
          updatedTemplate
        )
        
        console.log(`✅ Updated template: ${templateData.name}`)
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
      console.log(`✅ Created new template: ${templateData.name}`)
    }
    
    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Template updated successfully' : 'Template created successfully',
      templateId: isUpdate ? templateData._id : result.insertedId.toString()
    })
    
  } catch (error) {
    console.error('💥 Error saving template to MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Deleting campaign template from MongoDB')
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

    const collection = await getTemplatesCollection()
    const result = await collection.deleteOne({ _id: new ObjectId(templateId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Deleted template: ${templateId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
    
  } catch (error) {
    console.error('💥 Error deleting template from MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

// Helper function to get a random template (used by dummy campaigns)
export async function getRandomTemplate(): Promise<TemplateData | null> {
  try {
    const collection = await getTemplatesCollection()
    const templates = await collection.find({}).toArray()
    
    if (templates.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * templates.length)
    const randomTemplate = templates[randomIndex]
    
    // Convert ObjectId to string for consistency
    return {
      ...randomTemplate,
      _id: randomTemplate._id.toString()
    }
  } catch (error) {
    console.error('Error getting random template from MongoDB:', error)
    return null
  }
}