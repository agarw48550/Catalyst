import { NextResponse } from 'next/server'
import { smartGenerate } from '@/lib/ai/gemini'

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

Return a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "overallScore": 75,
  "perQuestion": [
    {
      "question": "Question text",
      "feedback": "Feedback on the answer",
      "score": 80
    }
  ],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["area1", "area2"],
  "tips": ["tip1", "tip2"]
}`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash' })
    let text = result.text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const feedback = JSON.parse(text)
    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error('Interview feedback error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate feedback' }, { status: 500 })
  }
}
