import { NextResponse } from 'next/server'
import { getTemplateOptions } from '@/lib/dummy-campaign-templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('📋 Fetching dummy campaign templates')
    
    const templates = getTemplateOptions()
    
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