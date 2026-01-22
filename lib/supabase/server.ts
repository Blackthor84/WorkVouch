/**
 * Server-only Supabase client creation
 * ✅ Only import this file in server components or API routes
 * ✅ Declare supabase once per function and reuse for all queries
 */
import { createServerClient as createSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { env } from '@/lib/env'

export const createSupabaseServerClient = async () => {
  // Use centralized env - these are validated at runtime when actually used
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in Vercel Project Settings → Environment Variables.'
    )
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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

// Export as createServerClient for backward compatibility
export const createServerClient = createSupabaseServerClient
