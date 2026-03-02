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

// Attempt to repair truncated JSON (unterminated strings, missing brackets)
function repairJSON(text: string): string {
  let s = text.trim()
  // Count open/close braces and brackets
  let braces = 0, brackets = 0, inString = false, escaped = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escaped) { escaped = false; continue }
    if (c === '\\') { escaped = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') braces++
    if (c === '}') braces--
    if (c === '[') brackets++
    if (c === ']') brackets--
  }
  // If we ended inside a string, close it
  if (inString) s += '"'
  // Close any open arrays and objects
  while (brackets > 0) { s += ']'; brackets-- }
  while (braces > 0) { s += '}'; braces-- }
  return s
}

export async function POST(request: Request) {
  try {
    const { questions, answers, jobRole } = await request.json()

    if (!questions || !answers || questions.length === 0) {
      return NextResponse.json({ error: 'questions and answers are required' }, { status: 400 })
    }

    const qaText = questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${(answers[i] || '(no answer provided)').slice(0, 800)}`).join('\n\n')

    const prompt = `You are an expert interview coach evaluating interview answers for a ${jobRole || 'general'} position.

Evaluate these interview Q&A pairs:

${qaText}

IMPORTANT: Return ONLY valid JSON. No text before or after the JSON. Keep each feedback string under 100 words to stay within limits.
{
  "overallScore": 75,
  "perQuestion": [
    {"question": "Question text", "feedback": "Brief feedback", "score": 80}
  ],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["area1", "area2"],
  "tips": ["tip1", "tip2"]
}`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 8192 })
    let text = cleanAIResponse(result.text)
    let feedback
    try {
      feedback = JSON.parse(text)
    } catch {
      // Try repairing truncated JSON
      try {
        text = repairJSON(text)
        feedback = JSON.parse(text)
      } catch (e2: any) {
        console.error('JSON repair failed:', e2.message, 'Raw:', result.text.slice(0, 500))
        throw new Error('AI returned invalid format. Please try again.')
      }
    }
    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error('Interview feedback error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate feedback' }, { status: 500 })
  }
}
