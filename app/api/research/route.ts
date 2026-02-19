import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const { query, type } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const typeInstructions: Record<string, string> = {
      company: 'Provide a detailed company research report including culture, recent news, interview tips, and pros/cons of working there.',
      industry: 'Provide industry trends, growth prospects, key players, required skills, and future outlook.',
      salary: 'Provide salary insights for the Indian job market including ranges by experience, city, and company type.',
      'career-path': 'Provide a detailed career path roadmap including required skills, certifications, typical timeline, and salary progression.',
    }

    const instruction = typeInstructions[type] || 'Provide comprehensive career advice and insights relevant to the Indian job market.'

    const prompt = `You are a career research expert specializing in the Indian job market.

Query: ${query}

${instruction}

Provide a well-structured, detailed response in plain text (no markdown headers, use natural paragraphs).`

    const result = await generateContent({ prompt, model: 'gemini-2.5-pro', maxTokens: 4096 })
    return NextResponse.json({ response: result.text, query, type })
  } catch (error: any) {
    console.error('Research error:', error)
    return NextResponse.json({ error: error.message || 'Research failed' }, { status: 500 })
  }
}
