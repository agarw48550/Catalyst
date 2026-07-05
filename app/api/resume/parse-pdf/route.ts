import { NextResponse } from 'next/server'
import { generateGeminiOnlyWithContents, RESUME_MODEL_CANDIDATES } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    const result = await generateGeminiOnlyWithContents({
      modelCandidates: [...RESUME_MODEL_CANDIDATES],
      temperature: 0.1,
      maxTokens: 8192,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64,
              },
            },
            {
              text: 'Extract ALL text content from this resume PDF. Return ONLY the raw text content exactly as it appears, preserving the structure (headings, bullet points, sections). Do not add any commentary or formatting instructions.',
            },
          ],
        },
      ],
    })

    const text = result.text || ''

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF. The file may be empty or corrupted.' }, { status: 422 })
    }

    return NextResponse.json(
      { text: text.trim(), pages: 1 },
      {
        headers: {
          'X-AI-Model': result.model,
          'X-AI-Fallback': String(result.fallbackUsed),
        },
      }
    )
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 })
  }
}
