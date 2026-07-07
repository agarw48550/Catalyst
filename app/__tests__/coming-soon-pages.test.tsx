import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/components/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}))

vi.mock('@/lib/i18n/context', async () => {
  const { translations } = await import('@/lib/i18n/translations')
  return {
    useLanguage: () => ({ t: (key: string) => (translations.en as Record<string, string>)[key] || key }),
  }
})

import InterviewPage from '../interview/page'
import JobsPage from '../jobs/page'
import ResearchPage from '../research/page'
import SettingsPage from '../settings/page'

describe('coming soon product pages', () => {
  it('renders the interview practice roadmap page', () => {
    render(<InterviewPage />)

    expect(screen.getByText(/interview practice is on the roadmap/i)).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })

  it('renders the job search roadmap page', () => {
    render(<JobsPage />)

    expect(screen.getByText(/job search is on the roadmap/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open resume builder/i })).toHaveAttribute('href', '/resume')
  })

  it('renders the career research roadmap page', () => {
    render(<ResearchPage />)

    expect(screen.getByRole('heading', { name: /career research is on the roadmap/i })).toBeInTheDocument()
  })

  it('renders the settings roadmap page with the Clerk note', () => {
    render(<SettingsPage />)

    expect(screen.getByText(/settings is on the roadmap/i)).toBeInTheDocument()
    expect(screen.getByText(/managed by clerk/i)).toBeInTheDocument()
  })
})
