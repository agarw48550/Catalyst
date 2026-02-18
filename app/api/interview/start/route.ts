import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const { jobRole, interviewType, language } = await request.json()

    if (!jobRole || !interviewType) {
      return NextResponse.json({ error: 'jobRole and interviewType are required' }, { status: 400 })
    }

    const prompt = `Generate 5 ${interviewType} interview questions for a ${jobRole} position.
${language && language !== 'English' ? `Questions should be in ${language}.` : ''}

Return a JSON array of question strings only, like:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]

No markdown, no code fences, just the raw JSON array.`

    const result = await generateContent({ prompt, model: 'gemini-2.0-flash' })
    let text = result.text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const questions: string[] = JSON.parse(text)
    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Interview start error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 })
  }
}
