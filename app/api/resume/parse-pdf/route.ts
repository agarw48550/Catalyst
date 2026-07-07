import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { generateGeminiOnlyWithContents, RESUME_MODEL_CANDIDATES } from '@/lib/ai/gemini'

// Below this many characters, a "text" extraction is treated as a scanned/image-only
// PDF (no real text layer) and we fall back to the slower vision-LLM path.
const MIN_VIABLE_TEXT_LENGTH = 40

// Defensive strip for the rare LLM-vision fallback path: drop a leading line if it
// looks like the model echoing its own instructions instead of the PDF's content.
function stripLeakedPreamble(text: string): string {
  const lines = text.split('\n')
  const first = lines[0]?.trim().toLowerCase() ?? ''
  const looksLikePreamble =
    first.length > 0 &&
    first.length < 120 &&
    /^(here is|here's|sure|okay|extracted text|the extracted text|below is)/.test(first)
  return looksLikePreamble ? lines.slice(1).join('\n').trim() : text
}

async function extractViaLocalParser(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text.trim()
}

async function extractViaVisionModel(arrayBuffer: ArrayBuffer): Promise<string> {
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const result = await generateGeminiOnlyWithContents({
    modelCandidates: [...RESUME_MODEL_CANDIDATES],
    temperature: 0.1,
    maxTokens: 4096,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          {
            text: 'Extract ALL text content from this resume PDF. Return ONLY the raw text content exactly as it appears, preserving the structure (headings, bullet points, sections). Do not add any commentary or formatting instructions.',
          },
        ],
      },
    ],
  })

  return stripLeakedPreamble((result.text || '').trim())
}

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

    let text = ''
    let usedFallback = false

    try {
      text = await extractViaLocalParser(arrayBuffer)
    } catch (localError) {
      console.warn('Local PDF text extraction failed, falling back to vision model:', localError)
    }

    if (text.length < MIN_VIABLE_TEXT_LENGTH) {
      usedFallback = true
      text = await extractViaVisionModel(arrayBuffer)
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF. The file may be empty or corrupted.' }, { status: 422 })
    }

    return NextResponse.json(
      { text: text.trim() },
      { headers: { 'X-Extraction-Method': usedFallback ? 'vision-model' : 'local' } }
    )
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 })
  }
}
