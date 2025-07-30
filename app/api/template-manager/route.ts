import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TemplateData {
  id: string
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

// File path for storing templates (in production, use a database)
const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'campaign-templates.json')

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(TEMPLATES_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load templates from file
const loadTemplates = (): TemplateData[] => {
  try {
    ensureDataDir()
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8')
      return JSON.parse(data)
    }
    return []
  } catch (error) {
    console.error('Error loading templates:', error)
    return []
  }
}

// Save templates to file
const saveTemplates = (templates: TemplateData[]) => {
  try {
    ensureDataDir()
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  } catch (error) {
    console.error('Error saving templates:', error)
    throw error
  }
}

// GET - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching campaign templates')
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const templates = loadTemplates()
    
    console.log(`✅ Returning ${templates.length} templates`)
    
    return NextResponse.json({
      success: true,
      templates,
      totalTemplates: templates.length
    })
    
  } catch (error) {
    console.error('💥 Error fetching templates:', error)
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
    console.log('💾 Saving campaign template')
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

    const templates = loadTemplates()
    const now = new Date().toISOString()
    
    // Check if template exists (update) or create new
    const existingIndex = templates.findIndex(t => t.id === templateData.id)
    
    const template: TemplateData = {
      ...templateData,
      createdAt: existingIndex >= 0 ? templates[existingIndex].createdAt : now,
      updatedAt: now
    }
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template
      console.log(`✅ Updated template: ${template.name}`)
    } else {
      templates.push(template)
      console.log(`✅ Created new template: ${template.name}`)
    }
    
    saveTemplates(templates)
    
    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Template updated successfully' : 'Template created successfully',
      template
    })
    
  } catch (error) {
    console.error('💥 Error saving template:', error)
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
    console.log('🗑️ Deleting campaign template')
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

    const templates = loadTemplates()
    const initialCount = templates.length
    const filteredTemplates = templates.filter(t => t.id !== templateId)
    
    if (filteredTemplates.length === initialCount) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }
    
    saveTemplates(filteredTemplates)
    
    console.log(`✅ Deleted template: ${templateId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
    
  } catch (error) {
    console.error('💥 Error deleting template:', error)
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
    const templates = loadTemplates()
    if (templates.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * templates.length)
    return templates[randomIndex]
  } catch (error) {
    console.error('Error getting random template:', error)
    return null
  }
}