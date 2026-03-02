'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export type SignUpResult =
  | { confirmationPending: false }
  | { confirmationPending: true; email: string }

/**
 * Perform sign-up. Extracted as a standalone function for testability.
 *
 * - If Supabase returns a session (auto-confirm or provider), redirects to /dashboard.
 * - If no session (email confirmation required), returns { confirmationPending: true, email }.
 */
export async function performSignUp(
  email: string,
  password: string,
  name: string
): Promise<SignUpResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  })
  if (error) throw error

  console.info('[useAuth] signUp result:', {
    hasSession: !!data.session,
    email,
  })

  if (data.session) {
    window.location.href = '/dashboard'
    return { confirmationPending: false }
  }

  // Email confirmation required — do NOT redirect to dashboard
  return { confirmationPending: true, email }
}

/**
 * Perform sign-in. Extracted for testability.
 */
export async function performSignIn(email: string, password: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  window.location.href = '/dashboard'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }: any) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, name: string) {
    return performSignUp(email, password, name)
  }

  async function signIn(email: string, password: string) {
    return performSignIn(email, password)
  }

  async function signOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return { user, loading, signIn, signUp, signOut }
}
