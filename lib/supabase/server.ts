import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Official Next.js App Router Supabase server client
 * Use this in server components, server actions, and API routes
 * 
 * This uses the official @supabase/ssr pattern for Next.js App Router
 * Note: In Next.js 15+, cookies() may be async, so this function is async
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()
  
  return createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Cookies can only be set in Server Actions or Route Handlers
            // This is expected in some contexts (e.g., during rendering)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // Cookies can only be removed in Server Actions or Route Handlers
            // This is expected in some contexts (e.g., during rendering)
          }
        },
      },
    }
  )
}

// Export aliases for backward compatibility (deprecated - use createServerSupabase)
export const createServerClient = createServerSupabase
export const createSupabaseServerClient = createServerSupabase
