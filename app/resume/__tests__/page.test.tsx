import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { redirect } from 'next/navigation'
import ResumePage from '../page'

describe('ResumePage', () => {
  it('redirects to dashboard', () => {
    ResumePage()
    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })
})
