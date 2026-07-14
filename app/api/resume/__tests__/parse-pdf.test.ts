import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateGeminiOnlyWithContents, mockExtractText, mockGetDocumentProxy } = vi.hoisted(() => ({
  mockGenerateGeminiOnlyWithContents: vi.fn(),
  mockExtractText: vi.fn(),
  mockGetDocumentProxy: vi.fn(),
}))

vi.mock('@/lib/ai/gemini', () => ({
  generateGeminiOnlyWithContents: mockGenerateGeminiOnlyWithContents,
  RESUME_MODEL_CANDIDATES: ['gemma-4-31b-it', 'gemma-4-26b-a4b-it', 'gemini-3.1-flash-lite'],
}))

vi.mock('unpdf', () => ({
  extractText: mockExtractText,
  getDocumentProxy: mockGetDocumentProxy,
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
    mockGetDocumentProxy.mockResolvedValue({})
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

  it('extracts text locally via unpdf without calling the vision model', async () => {
    const extracted = '  Jane Doe\nSoftware Engineer\n5 years of experience building web applications.  '
    mockExtractText.mockResolvedValue({ totalPages: 1, text: extracted })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ text: extracted.trim() })
    expect(response.headers.get('X-Extraction-Method')).toBe('local')
    expect(mockGenerateGeminiOnlyWithContents).not.toHaveBeenCalled()
  })

  it('falls back to the vision model when local extraction yields little/no text (scanned PDF)', async () => {
    mockExtractText.mockResolvedValue({ totalPages: 1, text: '  ' })
    mockGenerateGeminiOnlyWithContents.mockResolvedValue({
      text: 'Jane Doe\nSoftware Engineer',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ text: 'Jane Doe\nSoftware Engineer' })
    expect(response.headers.get('X-Extraction-Method')).toBe('vision-model')
    expect(mockGenerateGeminiOnlyWithContents).toHaveBeenCalledTimes(1)
  })

  it('strips a leaked preamble line from the vision-model fallback response', async () => {
    mockExtractText.mockResolvedValue({ totalPages: 1, text: '' })
    mockGenerateGeminiOnlyWithContents.mockResolvedValue({
      text: 'Here is the extracted text:\nJane Doe\nSoftware Engineer',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const payload = await response.json()

    expect(payload.text).toBe('Jane Doe\nSoftware Engineer')
  })

  it('falls back to the vision model when local extraction throws', async () => {
    mockExtractText.mockRejectedValue(new Error('bad pdf structure'))
    mockGenerateGeminiOnlyWithContents.mockResolvedValue({
      text: 'Jane Doe\nSoftware Engineer',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))

    expect(response.status).toBe(200)
    expect(mockGenerateGeminiOnlyWithContents).toHaveBeenCalledTimes(1)
  })

  it('returns 422 when neither local extraction nor the vision model find text', async () => {
    mockExtractText.mockResolvedValue({ totalPages: 1, text: '' })
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

  it('returns 500 when the vision model fallback fails', async () => {
    mockExtractText.mockResolvedValue({ totalPages: 1, text: '' })
    mockGenerateGeminiOnlyWithContents.mockRejectedValue(new Error('Gemma PDF extraction failed'))

    const file = new File(['pdf-bytes'], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Gemma PDF extraction failed' })
  })
})
