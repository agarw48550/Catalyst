import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (supabaseInstance) return supabaseInstance
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // createBrowserClient from @supabase/ssr stores session tokens
  // in cookies (not localStorage), so Next.js middleware can read them.
  supabaseInstance = createBrowserClient(url, key)
  
  return supabaseInstance
}
