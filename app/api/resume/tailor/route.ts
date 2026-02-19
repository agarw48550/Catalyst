import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { resumeText, jobTitle, company, jobDescription } = body

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'resumeText and jobDescription are required' }, { status: 400 })
    }

    const prompt = `You are an expert resume tailor and ATS optimization specialist for the Indian job market.

Given the following resume and job description, tailor the resume to better match the job.

RESUME:
${resumeText}

JOB TITLE: ${jobTitle || 'Not specified'}
COMPANY: ${company || 'Not specified'}
JOB DESCRIPTION:
${jobDescription}

Return a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "tailoredResume": "The full tailored resume text with improved bullet points and keywords",
  "atsScore": 85,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "suggestions": ["suggestion1", "suggestion2"],
  "summary": "A brief summary of changes made"
}`

    const result = await generateContent({ prompt, model: 'gemini-2.5-pro', maxTokens: 4096 })
    let text = result.text.trim()

    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume tailor error:', error)
    return NextResponse.json({ error: error.message || 'Failed to tailor resume' }, { status: 500 })
  }
}
