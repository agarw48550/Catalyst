'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'
import type { Database } from '@/config/supabase'

let cachedClient: SupabaseClient<Database> | null = null
let cachedTokenGetter: (() => Promise<string | null>) | null = null

function createClerkSupabaseClient(getToken: () => Promise<string | null>): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(url, key, {
    async accessToken() {
      return getToken()
    },
  })
}

export function useSupabaseClient(): SupabaseClient<Database> | null {
  const { session } = useSession()

  return useMemo(() => {
    if (!session) return null

    const getToken = () => session.getToken()

    if (cachedClient && cachedTokenGetter === getToken) {
      return cachedClient
    }

    cachedTokenGetter = getToken
    cachedClient = createClerkSupabaseClient(getToken)
    return cachedClient
  }, [session])
}
