import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('@/components/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/i18n/context', () => ({
  useLanguage: () => ({ t: (key: string) => ({ 'dash.welcome': 'Welcome back' }[key] || key) }),
}))

import { useAuth } from '@/hooks/useAuth'
import DashboardPage from '../page'

const mockUseAuth = vi.mocked(useAuth)

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows a loading state while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<DashboardPage />)

    expect(screen.queryByText('Resume Builder')).not.toBeInTheDocument()
  })

  it('renders the resume-focused dashboard without removed feature links', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'jane@example.com', user_metadata: { full_name: 'Jane' } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: /resume builder/i })).toBeInTheDocument()
    expect(screen.getByText(/production focus/i)).toBeInTheDocument()
    expect(screen.queryByText(/interview practice/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^job search$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/career research/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^settings$/i)).not.toBeInTheDocument()
  })

  it('reads the resume count from localStorage', () => {
    localStorage.setItem('catalyst_resume_count', '7')
    mockUseAuth.mockReturnValue({
      user: { email: 'jane@example.com', user_metadata: { full_name: 'Jane' } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    render(<DashboardPage />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open resume builder/i })).toHaveAttribute('href', '/resume')
  })
})
