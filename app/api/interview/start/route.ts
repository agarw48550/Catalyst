import { NextResponse } from 'next/server'
import { smartGenerate } from '@/lib/ai/gemini'

function cleanAIResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  // Strip DeepSeek R1 chain-of-thought blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  // Find the JSON array
  const firstBracket = cleaned.indexOf('[')
  const lastBracket = cleaned.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1)
  }
  return cleaned
}

export async function POST(request: Request) {
  try {
    const { jobRole, targetCompany, interviewType, language } = await request.json()

    if (!jobRole || !interviewType) {
      return NextResponse.json({ error: 'jobRole and interviewType are required' }, { status: 400 })
    }

    const companyContext = targetCompany
      ? `\nCOMPANY CONTEXT: The candidate is preparing for an interview at "${targetCompany}".
- Research what "${targetCompany}" is known for asking in interviews
- Include questions that reflect "${targetCompany}"'s culture, values, and interview style
- For example: Google is known for brain-teasers and system design; Amazon for Leadership Principles; McKinsey for case interviews
- Reference the company's products, services, or industry challenges where relevant
- At least 2 questions should be company-specific (the kind "${targetCompany}" would actually ask)`
      : ''

    const prompt = `You are an expert interviewer${targetCompany ? ` at ${targetCompany}` : ' at a top company'} hiring for a "${jobRole}" position.
Generate exactly 5 unique, challenging ${interviewType} interview questions specifically tailored for this "${jobRole}" role.
${companyContext}
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

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', temperature: 0.9, maxTokens: 4096 })
    const text = cleanAIResponse(result.text)

    try {
      const questions: string[] = JSON.parse(text)
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Response was not an array of questions')
      }
      return NextResponse.json({ questions: questions.slice(0, 5) })
    } catch (parseError: any) {
      console.error('Interview start JSON parse failed:', parseError.message)
      console.error('Raw text:', result.text.slice(0, 500))
      return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Interview start error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate questions' }, { status: 500 })
  }
}
