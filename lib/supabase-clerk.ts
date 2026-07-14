import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { config } from '@/config'
import type { Database } from '@/config/supabase'

export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const url = config.supabase.url
  const anonKey = config.supabase.anonKey

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
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
  return userId
}
