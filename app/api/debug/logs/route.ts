import { NextRequest, NextResponse } from 'next/server'
import { getApiLogs } from '@/lib/logger'

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

    const searchParams = request.nextUrl.searchParams
    const service = searchParams.get('service') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const logs = await getApiLogs({ service, limit, offset })

    return NextResponse.json({ logs, count: logs.length })
  } catch (error: any) {
    console.error('Failed to fetch API logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
