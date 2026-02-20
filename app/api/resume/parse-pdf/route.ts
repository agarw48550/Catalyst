import { NextResponse } from 'next/server'

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

    // Use Gemini to extract text from PDF — avoids DOMMatrix/canvas issues
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_SECONDARY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
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
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Gemini PDF parse error:', err)
      throw new Error('Failed to extract text from PDF')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF. The file may be empty or corrupted.' }, { status: 422 })
    }

    return NextResponse.json({ text: text.trim(), pages: 1 })
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 })
  }
}
