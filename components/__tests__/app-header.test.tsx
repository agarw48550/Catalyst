import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock('@clerk/nextjs', () => ({
  Show: ({ children }: any) => <>{children}</>,
  SignInButton: ({ children }: any) => <>{children}</>,
  SignUpButton: ({ children }: any) => <>{children}</>,
  UserButton: () => <div>User menu</div>,
}))

vi.mock('@/lib/i18n/context', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        'nav.dashboard': 'Dashboard',
        'nav.resume': 'Resume',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
      }[key] || key),
  }),
  LanguageToggle: () => <button type="button">Language</button>,
}))

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}))

import { AppHeader } from '../app-header'

describe('AppHeader', () => {
  it('renders only dashboard link in the main navigation', () => {
    render(<AppHeader />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('does not render removed feature links', () => {
    render(<AppHeader />)

    expect(screen.queryByRole('link', { name: /interview/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /jobs/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /research/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
  })
})
