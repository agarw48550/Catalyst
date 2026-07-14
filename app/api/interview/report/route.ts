import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateGeminiOnly, RESUME_MODEL_CANDIDATES } from '@/lib/ai/gemini'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { buildInterviewReportPrompt, type InterviewReport } from '@/lib/interview/prompts'

const reportRequestSchema = z.object({
  sessionId: z.string().uuid(),
  jobTitle: z.string().max(200).optional().default(''),
  company: z.string().max(200).optional().default(''),
  difficulty: z.string().max(20).optional().default('normal'),
  transcript: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).min(1),
})

function cleanAIResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  return cleaned
}

function fallbackReport(transcriptLength: number): InterviewReport {
  return {
    summary: transcriptLength < 2
      ? 'The interview ended before enough conversation was captured to score deeply. Try another full session for a richer report.'
      : 'We reviewed your practice interview and prepared starter coaching notes. Re-run if this summary feels incomplete.',
    topicsDiscussed: ['Introduction and role fit'],
    strengths: ['Showed up and completed a live practice session'],
    gaps: ['Transcript was limited — key themes may be missing from this report'],
    improvements: [
      'Aim for fuller STAR examples (Situation, Task, Action, Result)',
      'Practice quantifying impact with numbers where possible',
      'Complete a full-length session so coaching can be more specific',
    ],
    overallScore: transcriptLength < 2 ? 40 : 60,
  }
}

export async function POST(request: Request) {
  try {
    await requireClerkUserId()
    const raw = await request.json()
    const parsed = reportRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { sessionId, jobTitle, company, difficulty, transcript } = parsed.data
    const supabase = await createSupabaseServerClient()

    const prompt = buildInterviewReportPrompt({
      jobTitle: jobTitle || 'Candidate',
      company: company || 'Company',
      difficulty,
      transcript,
    })

    let report: InterviewReport
    try {
      const result = await generateGeminiOnly({
        prompt,
        maxTokens: 4096,
        modelCandidates: [...RESUME_MODEL_CANDIDATES],
      })
      report = JSON.parse(cleanAIResponse(result.text)) as InterviewReport
      if (!report.summary || !Array.isArray(report.strengths)) {
        throw new Error('Invalid report shape')
      }
      if (typeof report.overallScore !== 'number') report.overallScore = 65
      report.overallScore = Math.max(0, Math.min(100, Math.round(report.overallScore)))
      report.topicsDiscussed = report.topicsDiscussed || []
      report.gaps = report.gaps || []
      report.improvements = report.improvements || []
    } catch (error) {
      console.error('Interview report generation failed:', error)
      report = fallbackReport(transcript.length)
    }

    await supabase
      .from('interview_sessions')
      .update({
        transcript,
        feedback: report,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    return NextResponse.json({ report })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate report'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
