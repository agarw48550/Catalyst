import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/components/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}))

vi.mock('@/lib/i18n/context', async () => {
  const { translations } = await import('@/lib/i18n/translations')
  return {
    useLanguage: () => ({ t: (key: string) => (translations.en as Record<string, string>)[key] || key }),
    LANG_LABELS: { en: 'English', hi: 'Hindi', mr: 'Marathi', or: 'Odia' },
  }
})

import { useUser } from '@clerk/nextjs'
import DashboardPage from '../page'

const mockUseUser = vi.mocked(useUser)

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ applications: [] }),
    }) as typeof fetch
  })

  it('shows a loading state while auth is loading', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
    } as any)

    render(<DashboardPage />)
    expect(screen.queryByText(/add application/i)).not.toBeInTheDocument()
  })

  it('renders the applications dashboard with empty state', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { firstName: 'Jane', primaryEmailAddress: { emailAddress: 'jane@example.com' } },
    } as any)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/no applications yet/i)).toBeInTheDocument()
    })
    const addLinks = screen.getAllByRole('link', { name: /add application/i })
    expect(addLinks[0]).toHaveAttribute('href', '/dashboard/new')
  })

  it('lists applications when API returns data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        applications: [{
          id: 'abc',
          job_title: 'Software Engineer',
          company: 'Razorpay',
          language: 'en',
          research_status: 'complete',
          created_at: new Date().toISOString(),
        }],
      }),
    }) as typeof fetch

    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { firstName: 'Jane' },
    } as any)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Razorpay')).toBeInTheDocument()
    })
  })
})
