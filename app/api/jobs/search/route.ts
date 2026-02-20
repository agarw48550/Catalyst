import { NextResponse } from 'next/server'
import { searchJobs } from '@/lib/jobs'
import { smartGenerate } from '@/lib/ai/gemini'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const location = searchParams.get('location') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!q) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 })
  }

  // Try real job APIs first
  try {
    console.log(`[Jobs] Searching for "${q}" location="${location || 'default'}" page=${page}`)
    const jobs = await searchJobs({ query: q, location, page })
    if (jobs.length > 0) {
      console.log(`[Jobs] Found ${jobs.length} results from APIs`)
      return NextResponse.json({ jobs, count: jobs.length, source: 'api' })
    }
  } catch (error: any) {
    console.warn('[Jobs] API search failed, falling back to AI:', error.message)
  }

  // Fallback: use AI to generate realistic job listings with real apply links
  try {
    console.log(`[Jobs] Using AI fallback for "${q}" in "${location || 'India'}"`)
    const prompt = `Generate 8 realistic job listings for "${q}" in ${location || 'India'}.

For each job, provide a REAL job portal URL where someone could find similar jobs (use naukri.com, linkedin.com/jobs, indeed.co.in, or glassdoor.co.in with appropriate search URLs).

Return ONLY a JSON array (no markdown, no text before/after):
[{
  "id": "ai-1",
  "title": "Exact job title",
  "company": "Real company name that actually hires for this role in India",
  "location": "Specific city, India",
  "description": "2-3 sentence job description with key responsibilities",
  "salary": "₹X - ₹Y LPA",
  "postedDate": "Recent",
  "url": "https://www.naukri.com/...-jobs-in-...",
  "source": "ai-suggested"
}]`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 4096 })
    let text = result.text.trim()
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const firstBracket = text.indexOf('[')
    const lastBracket = text.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      text = text.slice(firstBracket, lastBracket + 1)
    }
    const aiJobs = JSON.parse(text)
    return NextResponse.json({ jobs: aiJobs, count: aiJobs.length, source: 'ai-suggested' })
  } catch (aiError: any) {
    console.error('[Jobs] AI fallback also failed:', aiError.message)
    return NextResponse.json(
      { error: 'Job search is temporarily unavailable. Please try again later.', jobs: [], count: 0 },
      { status: 200 }
    )
  }
}
