import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/components/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}))

vi.mock('@/lib/resume-pdf', () => ({
  generateResumePdfHtml: vi.fn(() => '<html><body>Resume PDF</body></html>'),
}))

import ResumePage from '../page'

describe('ResumePage', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = fetchMock as any

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    vi.stubGlobal(
      'open',
      vi.fn(() => ({
        document: { write: vi.fn(), close: vi.fn() },
        focus: vi.fn(),
      }))
    )
  })

  it('renders the resume builder input form', () => {
    render(<ResumePage />)

    expect(screen.getByText(/resume builder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your resume/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument()
    expect(screen.getByText(/what you will get/i)).toBeInTheDocument()
  })

  it('shows a client-side error for non-PDF uploads', async () => {
    render(<ResumePage />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['resume'], 'resume.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('Please upload a PDF resume.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a client-side error for oversized PDFs', async () => {
    render(<ResumePage />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'resume.pdf', {
      type: 'application/pdf',
    })

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText('PDF must be under 5MB.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('populates the resume textarea after a successful PDF upload', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Parsed resume text' }),
    })

    render(<ResumePage />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByLabelText(/your resume/i)).toHaveValue('Parsed resume text')
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/resume/parse-pdf', expect.objectContaining({ method: 'POST' }))
  })

  it('submits the form, renders the result, and increments the resume count', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tailoredResume: 'Tailored resume content',
        atsScore: 91,
        matchedSkills: ['SQL'],
        missingSkills: ['Python'],
        suggestions: ['Add measurable outcomes'],
        summary: 'Improved the resume for the target role.',
      }),
    })

    render(<ResumePage />)

    fireEvent.change(screen.getByLabelText(/your resume/i), { target: { value: 'Current resume' } })
    fireEvent.change(screen.getByLabelText(/job title/i), { target: { value: 'Data Analyst' } })
    fireEvent.change(screen.getByLabelText(/company \(optional\)/i), { target: { value: 'Catalyst' } })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Looking for a data analyst with SQL experience.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /tailor my resume/i }))

    expect(await screen.findByText(/ats score/i)).toBeInTheDocument()
    expect(await screen.findByText('Tailored resume content')).toBeInTheDocument()
    expect(localStorage.getItem('catalyst_resume_count')).toBe('1')
  })

  it('shows an API error when tailoring fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Tailoring failed' }),
    })

    render(<ResumePage />)

    fireEvent.change(screen.getByLabelText(/your resume/i), { target: { value: 'Current resume' } })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Looking for a frontend engineer.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /tailor my resume/i }))

    expect(await screen.findByText('Tailoring failed')).toBeInTheDocument()
  })

  it('copies the tailored resume to the clipboard', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tailoredResume: 'Tailored resume content',
        atsScore: 85,
        matchedSkills: [],
        missingSkills: [],
        suggestions: ['Add impact'],
        summary: 'Updated.',
      }),
    })

    render(<ResumePage />)

    fireEvent.change(screen.getByLabelText(/your resume/i), { target: { value: 'Current resume' } })
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: 'Looking for a designer.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /tailor my resume/i }))

    await screen.findByText('Tailored resume content')
    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Tailored resume content')
    })
  })
})
