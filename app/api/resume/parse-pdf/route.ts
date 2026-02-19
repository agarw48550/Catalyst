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

    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import to avoid bundling issues
    const pdfParseModule: any = await import('pdf-parse')
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(buffer)

    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from PDF. The file may be scanned/image-based.' }, { status: 422 })
    }

    return NextResponse.json({ text: data.text.trim(), pages: data.numpages })
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: error.message || 'Failed to parse PDF' }, { status: 500 })
  }
}
