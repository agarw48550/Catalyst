/**
 * Tests for useAuth hook signUp behavior.
 *
 * TDD: These tests define the DESIRED behavior:
 *   1. signUp returns { confirmationPending: false } and redirects when session exists
 *   2. signUp returns { confirmationPending: true, email } when no session (confirmation needed)
 *   3. signUp throws when Supabase returns an error
 *   4. signIn redirects to /dashboard on success (regression)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the Supabase browser client module
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase-browser', () => ({
    getSupabaseBrowserClient: () => ({
        auth: {
            signUp: mockSignUp,
            signInWithPassword: mockSignInWithPassword,
            signOut: mockSignOut,
            getSession: mockGetSession,
            onAuthStateChange: mockOnAuthStateChange,
        },
    }),
}))

// We test the extracted logic functions rather than the hook directly,
// since the hook has React state + effects that need renderHook.
// For simplicity, we import and test the standalone functions.
import { performSignUp, performSignIn } from '@/hooks/useAuth'

describe('performSignUp', () => {
    let originalLocation: Location

    beforeEach(() => {
        // Save and mock window.location
        originalLocation = window.location
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...originalLocation, href: '', origin: 'http://localhost:3000' },
        })
        vi.clearAllMocks()
    })

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        })
    })

    it('redirects to /dashboard when session exists (auto-confirm)', async () => {
        mockSignUp.mockResolvedValue({
            data: { session: { access_token: 'abc' }, user: { id: '1' } },
            error: null,
        })

        const result = await performSignUp('test@example.com', 'password123', 'John Doe')

        expect(result).toEqual({ confirmationPending: false })
        expect(window.location.href).toBe('/dashboard')
        expect(mockSignUp).toHaveBeenCalledOnce()
    })

    it('returns confirmationPending when no session (email confirmation required)', async () => {
        mockSignUp.mockResolvedValue({
            data: { session: null, user: { id: '1' } },
            error: null,
        })

        const result = await performSignUp('test@example.com', 'password123', 'John Doe')

        expect(result).toEqual({ confirmationPending: true, email: 'test@example.com' })
        // Should NOT redirect to /dashboard
        expect(window.location.href).not.toBe('/dashboard')
    })

    it('throws when Supabase returns an error', async () => {
        mockSignUp.mockResolvedValue({
            data: { session: null, user: null },
            error: { message: 'User already registered' },
        })

        await expect(
            performSignUp('test@example.com', 'password123', 'John Doe')
        ).rejects.toEqual({ message: 'User already registered' })

        expect(window.location.href).not.toBe('/dashboard')
    })

    it('passes emailRedirectTo option to Supabase signUp', async () => {
        mockSignUp.mockResolvedValue({
            data: { session: { access_token: 'abc' }, user: { id: '1' } },
            error: null,
        })

        await performSignUp('test@example.com', 'password123', 'John Doe')

        expect(mockSignUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: {
                data: { full_name: 'John Doe' },
                emailRedirectTo: 'http://localhost:3000/auth/confirm',
            },
        })
    })
})

describe('performSignIn', () => {
    let originalLocation: Location

    beforeEach(() => {
        originalLocation = window.location
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { ...originalLocation, href: '' },
        })
        vi.clearAllMocks()
    })

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        })
    })

    it('redirects to /dashboard on successful sign-in', async () => {
        mockSignInWithPassword.mockResolvedValue({ error: null })

        await performSignIn('test@example.com', 'password123')

        expect(window.location.href).toBe('/dashboard')
    })

    it('throws when sign-in fails', async () => {
        mockSignInWithPassword.mockResolvedValue({
            error: { message: 'Invalid login credentials' },
        })

        await expect(
            performSignIn('test@example.com', 'wrong')
        ).rejects.toEqual({ message: 'Invalid login credentials' })

        expect(window.location.href).not.toBe('/dashboard')
    })
})
