import { createServerClient as createSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Type-safe Supabase client helper
 * Use this in API routes for proper TypeScript typing
 */
export async function supabaseTyped() {
  const cookieStore = await cookies()

  // Use environment variables with fallback to hardcoded values for local dev
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sjwxcrmtivmhbqqlkrsh.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqd3hjcm10aXZtaGJxcWxrcnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTg3NTgsImV4cCI6MjA4MzI5NDc1OH0.k_ymo3UDNSfMnvvZvGPwg6AJm5c2Tfu5jhT_bthQ7og'

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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
