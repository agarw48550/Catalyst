import { NextRequest, NextResponse } from 'next/server'
import { checkApiHealth } from '@/lib/ai/gemini'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if debug dashboard is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD !== 'true') {
      return NextResponse.json(
        { error: 'Debug dashboard is not enabled' },
        { status: 403 }
      )
    }

    const health = await checkApiHealth()

    return NextResponse.json({ 
      gemini: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Failed to check API health:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check health' },
      { status: 500 }
    )
  }
}
