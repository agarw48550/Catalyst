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
    const jobs = await searchJobs({ query: q, location, page })
    return NextResponse.json({ jobs, count: jobs.length, source: 'aggregated' })
  } catch (error: any) {
    console.error('Job search error:', error)
    return NextResponse.json({ error: error.message || 'Failed to search jobs' }, { status: 500 })
  }
}
