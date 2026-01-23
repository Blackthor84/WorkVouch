import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Function to create Supabase client per request - runtime only, no top-level await
// In Next.js 16, cookies() is async and must be awaited
export const getSupabaseClient = async () => {
  const cookieStore = await cookies()

  // Support both naming conventions for flexibility
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.supabaseUrl;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing required Supabase environment variables: supabaseUrl (or NEXT_PUBLIC_SUPABASE_URL) and supabaseKey (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set in Vercel Project Settings → Environment Variables."
    );
  }

  return createSupabaseSSRClient<Database>(
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

// Export as createSupabaseServerClient for backward compatibility
export const createSupabaseServerClient = getSupabaseClient

// Export as createServerClient for backward compatibility
export const createServerClient = getSupabaseClient
