import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const { jobRole, interviewType, language } = await request.json()

    if (!jobRole || !interviewType) {
      return NextResponse.json({ error: 'jobRole and interviewType are required' }, { status: 400 })
    }

    const prompt = `You are an expert interviewer at a top company hiring for a "${jobRole}" position.
Generate exactly 5 unique, challenging ${interviewType} interview questions specifically tailored for this "${jobRole}" role.

Requirements:
- Questions MUST be specific to the "${jobRole}" position — reference actual skills, scenarios, and challenges a ${jobRole} would face
- Each question should test a DIFFERENT competency (e.g. problem-solving, leadership, technical depth, collaboration, adaptability)
- Questions must be DIFFERENT every time — avoid generic questions like "tell me about yourself"
- For technical interviews: include scenario-based questions that require demonstrating real expertise
- For behavioral interviews: use the STAR format prompts about real workplace situations relevant to ${jobRole}
- For HR interviews: focus on culture fit, career goals, and situational judgment specific to this role
${language && language !== 'English' ? `- Questions should be in ${language}.` : ''}

Return ONLY a JSON array of 5 question strings. No markdown, no code fences, just raw JSON:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`

    const result = await generateContent({ prompt, model: 'gemini-2.5-flash', temperature: 0.9 })
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
