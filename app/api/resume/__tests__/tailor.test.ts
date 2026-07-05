import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGenerateGeminiOnly } = vi.hoisted(() => ({
  mockGenerateGeminiOnly: vi.fn(),
}))

vi.mock('@/lib/ai/gemini', () => ({
  generateGeminiOnly: mockGenerateGeminiOnly,
  RESUME_MODEL_CANDIDATES: ['gemma-4-31b-it', 'gemma-4-26b-a4b-it'],
}))

import { POST } from '../tailor/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/resume/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildLongText(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index};`).join('')
}

describe('POST /api/resume/tailor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when resume text is missing', async () => {
    const response = await POST(makeRequest({ resumeText: '', jobDescription: 'Backend engineer role' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'String must contain at least 1 character(s)' })
  })

  it('returns 400 when job description is missing', async () => {
    const response = await POST(makeRequest({ resumeText: 'Resume text', jobDescription: '' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'String must contain at least 1 character(s)' })
  })

  it('truncates long resume and job description content before calling Gemini', async () => {
    mockGenerateGeminiOnly.mockResolvedValue({
      text: '{"tailoredResume":"ok","atsScore":90,"matchedSkills":[],"missingSkills":[],"suggestions":[],"summary":"done"}',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const longResume = buildLongText('resume-entry', 500)
    const longJobDescription = buildLongText('job-line', 500)

    const response = await POST(
      makeRequest({
        resumeText: longResume,
        jobTitle: 'Engineer',
        company: 'Catalyst',
        jobDescription: longJobDescription,
      })
    )

    expect(response.status).toBe(200)
    expect(mockGenerateGeminiOnly).toHaveBeenCalledOnce()

    const requestArg = mockGenerateGeminiOnly.mock.calls[0][0]
    expect(requestArg.prompt).toContain(longResume.slice(0, 4000))
    expect(requestArg.prompt).not.toContain(longResume.slice(4000))
    expect(requestArg.prompt).toContain(longJobDescription.slice(0, 3000))
    expect(requestArg.prompt).not.toContain(longJobDescription.slice(3000))
  })

  it('parses fenced JSON responses from Gemini', async () => {
    mockGenerateGeminiOnly.mockResolvedValue({
      text: '```json\n{"tailoredResume":"Tailored","atsScore":88,"matchedSkills":["SQL"],"missingSkills":["Python"],"suggestions":["Add metrics"],"summary":"Updated"}\n```',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const response = await POST(makeRequest({ resumeText: 'Resume', jobDescription: 'Job description' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.atsScore).toBe(88)
    expect(response.headers.get('X-AI-Model')).toBe('gemma-4-31b-it')
    expect(response.headers.get('X-AI-Fallback')).toBe('false')
  })

  it('strips think blocks before parsing JSON', async () => {
    mockGenerateGeminiOnly.mockResolvedValue({
      text: '<think>hidden reasoning</think>\n{"tailoredResume":"Tailored","atsScore":77,"matchedSkills":[],"missingSkills":[],"suggestions":["Tighten bullets"],"summary":"Updated"}',
      model: 'gemma-4-26b-a4b-it',
      fallbackUsed: true,
      keyUsed: 'secondary',
    })

    const response = await POST(makeRequest({ resumeText: 'Resume', jobDescription: 'Job description' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.atsScore).toBe(77)
    expect(response.headers.get('X-AI-Model')).toBe('gemma-4-26b-a4b-it')
    expect(response.headers.get('X-AI-Fallback')).toBe('true')
  })

  it('extracts the JSON object when Gemini adds extra wrapper text', async () => {
    mockGenerateGeminiOnly.mockResolvedValue({
      text: 'Here is the result:\n{"tailoredResume":"Tailored","atsScore":82,"matchedSkills":["React"],"missingSkills":[],"suggestions":[],"summary":"Updated"}\nThanks!',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const response = await POST(makeRequest({ resumeText: 'Resume', jobDescription: 'Job description' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.matchedSkills).toEqual(['React'])
  })

  it('returns 500 when Gemini responds with invalid JSON', async () => {
    mockGenerateGeminiOnly.mockResolvedValue({
      text: 'not valid json',
      model: 'gemma-4-31b-it',
      fallbackUsed: false,
      keyUsed: 'primary',
    })

    const response = await POST(makeRequest({ resumeText: 'Resume', jobDescription: 'Job description' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'AI response was not valid JSON. Please try again with a shorter resume or job description.',
    })
  })

  it('returns 500 when the Gemini call fails', async () => {
    mockGenerateGeminiOnly.mockRejectedValue(new Error('Gemma unavailable'))

    const response = await POST(makeRequest({ resumeText: 'Resume', jobDescription: 'Job description' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Gemma unavailable' })
  })
})
