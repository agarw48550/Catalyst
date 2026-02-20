import { NextResponse } from 'next/server'
import { smartGenerate } from '@/lib/ai/gemini'

function cleanAIResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const { questions, answers, jobRole } = await request.json()

    if (!questions || !answers || questions.length === 0) {
      return NextResponse.json({ error: 'questions and answers are required' }, { status: 400 })
    }

    const qaText = questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || '(no answer provided)'}`).join('\n\n')

    const prompt = `You are an expert interview coach evaluating interview answers for a ${jobRole || 'general'} position.

Evaluate these interview Q&A pairs:

${qaText}

IMPORTANT: Return ONLY valid JSON. No text before or after the JSON.
{
  "overallScore": 75,
  "perQuestion": [
    {"question": "Question text", "feedback": "Brief feedback", "score": 80}
  ],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["area1", "area2"],
  "tips": ["tip1", "tip2"]
}`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 4096 })
    const text = cleanAIResponse(result.text)
    const feedback = JSON.parse(text)
    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error('Interview feedback error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate feedback' }, { status: 500 })
  }
}
