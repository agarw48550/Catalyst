import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import type { Database } from '@/config/supabase'
import { touchUserActivity } from '@/lib/user-activity'

function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''

  return { url: url.trim(), anonKey: anonKey.trim() }
}

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getSupabaseEnv()

  if (!url || !anonKey) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)',
      !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY)',
    ].filter(Boolean)
    throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`)
  }

  return createClient<Database>(url, anonKey, {
    async accessToken() {
      return (await auth()).getToken()
    },
  }) as SupabaseClient<Database>
}

export async function requireClerkUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  // Best-effort activity heartbeat for inactivity cleanup
  void touchUserActivity(userId)
  return userId
}
