import { createServerClient as createSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Type-safe Supabase client helper
 * Use this in API routes for proper TypeScript typing
 * ✅ Uses runtime environment variables
 */
export async function supabaseTyped() {
  // Validate env vars at runtime (not build time)
  // Support both naming conventions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabaseUrl;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required Supabase environment variables: supabaseUrl (or NEXT_PUBLIC_SUPABASE_URL) and supabaseKey (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set in Vercel Project Settings → Environment Variables.'
    )
  }

  const cookieStore = await cookies()

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
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
