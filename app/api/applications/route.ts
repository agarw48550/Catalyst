import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { jobApplicationCreateSchema } from '@/lib/validations'

export async function GET() {
  try {
    const userId = await requireClerkUserId()
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('job_applications')
      .select('id, job_title, company, language, research_status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: data ?? [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()
    const raw = await request.json()
    const parsed = jobApplicationCreateSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { jobTitle, company, jobDescription, resumeText, language } = parsed.data
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        job_title: jobTitle,
        company,
        job_description: jobDescription,
        resume_text: resumeText,
        language,
        research_status: 'processing',
      })
      .select('id, job_title, company, language, research_status, created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to create application' }, { status: 500 })
    }

    return NextResponse.json({ application: data }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create application'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
