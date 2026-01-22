/**
 * Server-side Supabase admin client
 * ⚠️ MUST remain secret - never expose to browser
 * Uses service role key - bypasses RLS
 * Only use in API routes and server actions
 * 
 * ✅ Lazy-loaded to prevent build-time errors on Vercel
 */
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { env, validateServerEnv } from '@/lib/env'

let _supabaseServer: ReturnType<typeof createClient<Database>> | null = null

/**
 * Get or create the Supabase admin client
 * Validates environment variables at runtime (not build time)
 * This prevents build failures on Vercel when env vars are set in Vercel dashboard
 */
export function getSupabaseServer() {
  if (_supabaseServer) {
    return _supabaseServer
  }

  // Validate env vars at runtime (when actually used, not at module load)
  validateServerEnv()

  _supabaseServer = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return _supabaseServer
}

// Export as a getter property for backward compatibility
// This ensures lazy loading - the client is only created when accessed
export const supabaseServer = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseServer()
    const value = client[prop as keyof typeof client]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
