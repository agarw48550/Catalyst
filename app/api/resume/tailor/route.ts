import { NextResponse } from 'next/server'
import { smartGenerate } from '@/lib/ai/gemini'

function cleanAIResponse(text: string): string {
  let cleaned = text.trim()
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  // Strip DeepSeek R1 chain-of-thought blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  // Find the first { and last } to extract the JSON object
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { resumeText, jobTitle, company, jobDescription } = body

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'resumeText and jobDescription are required' }, { status: 400 })
    }

    // Truncate inputs to prevent extremely long prompts
    const truncatedResume = resumeText.slice(0, 4000)
    const truncatedJD = jobDescription.slice(0, 3000)

    const prompt = `You are an expert resume tailor and ATS optimization specialist for the Indian job market.

Given the following resume and job description, tailor the resume to better match the job.

RESUME:
${truncatedResume}

JOB TITLE: ${jobTitle || 'Not specified'}
COMPANY: ${company || 'Not specified'}
JOB DESCRIPTION:
${truncatedJD}

IMPORTANT: Your response MUST be valid JSON only. No explanation before or after.
Keep the tailoredResume field concise — use bullet points, not long paragraphs. Maximum 2000 characters for tailoredResume.

Return ONLY this JSON object:
{
  "tailoredResume": "Concise tailored resume with improved bullet points and keywords (max 2000 chars)",
  "atsScore": 85,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "suggestions": ["suggestion1", "suggestion2"],
  "summary": "Brief summary of changes made in 1-2 sentences"
}`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 8192 })
    const text = cleanAIResponse(result.text)

    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (parseError: any) {
      console.error('Resume tailor JSON parse failed. Raw text length:', result.text.length, 'Cleaned length:', text.length)
      console.error('Parse error:', parseError.message)
      console.error('First 500 chars:', text.slice(0, 500))
      console.error('Last 200 chars:', text.slice(-200))
      return NextResponse.json({
        error: `AI response was not valid JSON. Please try again with a shorter resume or job description.`,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Resume tailor error:', error)
    return NextResponse.json({ error: error.message || 'Failed to tailor resume' }, { status: 500 })
  }
}
