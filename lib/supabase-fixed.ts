import { createServerClient as createSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { env, validateEnv } from '@/lib/env'

/**
 * Type-safe Supabase client helper
 * Use this in API routes for proper TypeScript typing
 * ✅ Uses centralized env validation
 */
export async function supabaseTyped() {
  // Validate env vars at runtime (not build time)
  validateEnv()

  const cookieStore = await cookies()

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
