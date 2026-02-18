'use server'

/**
 * Server actions for authentication
 */

import { supabase } from '@/config/supabase'
import { sendWelcomeEmail } from '@/lib/mailers'

export interface AuthResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Sign up new user
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Send welcome email (don't fail signup if email fails)
    try {
      if (data.user?.email) {
        await sendWelcomeEmail(data.user.email, fullName || 'there')
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign up' }
  }
}

/**
 * Sign in user
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign in' }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign out' }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: user }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to get user' }
  }
}
