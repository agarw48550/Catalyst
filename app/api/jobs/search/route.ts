import { NextResponse } from 'next/server'
import { searchJobs } from '@/lib/jobs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const location = searchParams.get('location') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!q) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 })
  }

  try {
    console.log(`[Jobs] Searching for "${q}" location="${location || 'default'}" page=${page}`)
    const jobs = await searchJobs({ query: q, location, page })
    console.log(`[Jobs] Found ${jobs.length} results`)
    return NextResponse.json({ jobs, count: jobs.length, source: 'aggregated' })
  } catch (error: any) {
    console.error('[Jobs] Search failed:', error.message || error)
    return NextResponse.json(
      { error: error.message || 'Failed to search jobs', jobs: [], count: 0 },
      { status: 200 } // Return 200 with empty results instead of 500 so the UI doesn't show an error
    )
  }
}
