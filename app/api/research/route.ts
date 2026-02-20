import { NextResponse } from 'next/server'
import { smartGenerate } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const { query, type } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    // Sanitize input — only allow reasonable query lengths
    const sanitizedQuery = query.trim().slice(0, 500)

    const typeInstructions: Record<string, string> = {
      company: `Provide a concise company research report covering:
• What the company does (1-2 lines)
• Culture & work environment (2-3 lines)
• Interview process & tips (3-4 bullet points)
• Salary range for common roles in India
• Pros and cons (2-3 each)`,
      industry: `Provide a concise industry overview covering:
• Current state and market size (1-2 lines)
• Top 5 companies hiring in India
• Most in-demand skills and roles
• Growth outlook for next 2-3 years
• Salary ranges by experience level`,
      salary: `Provide concise salary insights for the Indian market:
• Salary range by experience (fresher / 3-5 yrs / 8+ yrs)
• Top-paying cities in India for this role
• Company tier comparison (MNC vs startup vs Indian IT)
• Total compensation breakdown (base + bonus + stocks)
• Negotiation tips`,
      'career-path': `Provide a concise career roadmap:
• Entry point and prerequisites
• Typical career progression (year-by-year for first 5 years)
• Must-have skills and certifications
• Salary progression at each stage
• Top companies that hire for this path in India`,
    }

    const instruction = typeInstructions[type] || 'Provide practical, concise career advice relevant to the Indian job market.'

    const prompt = `You are a career research expert specializing in the Indian job market.

Query: "${sanitizedQuery}"

${instruction}

RULES:
- Be concise and actionable — no filler text or generic advice
- Use bullet points and short paragraphs
- Include specific numbers, company names, and data where possible
- Focus on India-specific insights (Indian companies, INR salaries, Indian cities)
- Keep the total response under 600 words
- Do not include any harmful, discriminatory, or misleading content
- If the query is not career-related, politely redirect to career topics`

    const result = await smartGenerate({ prompt, model: 'gemini-2.5-flash', maxTokens: 2048 })
    return NextResponse.json({ response: result.text, query: sanitizedQuery, type })
  } catch (error: any) {
    console.error('Research error:', error)
    return NextResponse.json({ error: error.message || 'Research failed' }, { status: 500 })
  }
}
