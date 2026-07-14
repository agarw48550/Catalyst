import { NextResponse } from 'next/server'
import { config } from '@/config'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { interviewSessionSchema } from '@/lib/validations'
import { buildInterviewSystemInstruction, GEMINI_LIVE_WEBSOCKET_URL, INTERVIEW_DURATION_MINUTES, INTERVIEW_QUESTION_COUNT } from '@/lib/interview/prompts'
import type { CompanyResearch } from '@/lib/research/company-research'
import type { ResumeOutputLanguage } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const userId = await requireClerkUserId()

    if (!config.features.voiceInterview) {
      return NextResponse.json({ error: 'Voice interview is disabled' }, { status: 403 })
    }

    const apiKey = config.gemini.apiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    const raw = await request.json()
    const parsed = interviewSessionSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { applicationId, difficulty } = parsed.data
    const supabase = await createSupabaseServerClient()

    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const systemInstruction = buildInterviewSystemInstruction({
      jobTitle: application.job_title,
      company: application.company,
      jobDescription: application.job_description,
      resumeText: application.resume_text,
      language: application.language as ResumeOutputLanguage,
      difficulty,
      companyResearch: application.company_research as CompanyResearch | null,
    })

    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        type: 'live-voice',
        status: 'in_progress',
        job_application_id: applicationId,
        difficulty,
        transcript: [],
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: sessionError?.message || 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: session.id,
      apiKey,
      model: config.gemini.liveModel,
      systemInstruction,
      websocketUrl: GEMINI_LIVE_WEBSOCKET_URL,
      questionCount: INTERVIEW_QUESTION_COUNT[difficulty],
      durationMinutes: INTERVIEW_DURATION_MINUTES[difficulty],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create voice session'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
