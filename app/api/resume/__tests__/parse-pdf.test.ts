import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateGeminiOnlyWithContents } = vi.hoisted(() => ({
  mockGenerateGeminiOnlyWithContents: vi.fn(),
}))

vi.mock('@/lib/ai/gemini', () => ({
  generateGeminiOnlyWithContents: mockGenerateGeminiOnlyWithContents,
  RESUME_MODEL_CANDIDATES: ['gemma-4-31b-it', 'gemma-4-26b-a4b-it'],
}))

import { POST } from '../parse-pdf/route'

function makeRequest(file?: File) {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }

  return new Request('http://localhost/api/resume/parse-pdf', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/resume/parse-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when no file is uploaded', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'No file uploaded' })
  })

  it('returns 400 when a non-PDF file is uploaded', async () => {
    const file = new File(['hello'], 'resume.txt', { type: 'text/plain' })

    const response = await POST(makeRequest(file))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Only PDF files are accepted' })
  })

  it('returns 400 when the PDF is larger than 5MB', async () => {
    const largeFile = {
      type: 'application/pdf',
      size: 5 * 1024 * 1024 + 1,
    } as File

    const response = await POST({
      formData: async () => ({
        get: () => largeFile,
      }),
    } as unknown as Request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'File must be under 5MB' })
  })

  it('passes the PDF to the Gemma-only helper and returns extracted text', async () => {
    mockGenerateGeminiOnlyWithContents.mockResolvedValue({
      text: '  Jane Doe\nSoftware Engineer  ',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ text: 'Jane Doe\nSoftware Engineer', pages: 1 })
    expect(response.headers.get('X-AI-Model')).toBe('gemma-4-31b-it')
    expect(response.headers.get('X-AI-Fallback')).toBe('false')

    const requestArg = mockGenerateGeminiOnlyWithContents.mock.calls[0][0]
    expect(requestArg.modelCandidates).toEqual(['gemma-4-31b-it', 'gemma-4-26b-a4b-it'])
    expect(requestArg.contents[0].parts[0].inlineData.mimeType).toBe('application/pdf')
    expect(requestArg.contents[0].parts[0].inlineData.data.length).toBeGreaterThan(0)
  })

  it('returns 422 when Gemma extracts no text', async () => {
    mockGenerateGeminiOnlyWithContents.mockResolvedValue({
      text: '   ',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      error: 'Could not extract text from PDF. The file may be empty or corrupted.',
    })
  })

  it('returns 500 when no Gemini keys are configured', async () => {
    mockGenerateGeminiOnlyWithContents.mockRejectedValue(
      new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.')
    )

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'No Gemini API keys configured. Please set GEMINI_API_KEY in your environment variables.',
    })
  })

  it('returns 500 when the Gemini helper fails', async () => {
    mockGenerateGeminiOnlyWithContents.mockRejectedValue(new Error('Gemma PDF extraction failed'))

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Gemma PDF extraction failed' })
  })
})
