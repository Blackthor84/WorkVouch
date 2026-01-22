/**
 * Client-side Supabase client
 * Safe to use in browser/React components
 * Uses anon key - safe to expose to frontend
 * ✅ Uses centralized env validation
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { env, validateEnv } from '@/lib/env'

// Validate at runtime (not build time) to work with Vercel
let _supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

function getSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient
  }

  // Validate env vars at runtime
  validateEnv()

  _supabaseClient = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return _supabaseClient
}

// Export the client instance (lazy-loaded)
export const supabaseClient = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// Export createClient function for backward compatibility
export const createClient = () => {
  validateEnv()
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
