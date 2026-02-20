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
    const { question, answer, jobRole, interviewType } = await request.json()

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer are required' }, { status: 400 })
    }

    const prompt = `You are an expert interview coach for "${jobRole || 'general'}" positions.

The candidate was asked this ${interviewType || 'behavioral'} interview question:
"${question}"

Their answer was:
"${answer.slice(0, 1500)}"

Give brief, constructive feedback in 2-3 sentences. Include:
1. What was good about the answer
2. One specific improvement suggestion

IMPORTANT: Return ONLY valid JSON. No text before or after.
{"feedback": "Your 2-3 sentence feedback here", "score": 75, "tip": "One specific improvement tip"}`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 1024 })
    const text = cleanAIResponse(result.text)
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Answer feedback error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate feedback' }, { status: 500 })
  }
}
