import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './types';

// Function to create Supabase client per request - runtime only, no top-level await
export async function createServerSupabaseClient() {
  // In Next.js 16, cookies() is async and must be awaited
  const cookieStore = await cookies();

  // Get environment variables at runtime (not build time)
  const supabaseUrl = process.env.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase URL or Key not found. Please set process.env.supabaseUrl and process.env.supabaseKey (or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)'
    );
  }

  return createSupabaseSSRClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Export as getSupabaseClient for backward compatibility
export const getSupabaseClient = createServerSupabaseClient;

// Export as createSupabaseServerClient for backward compatibility
export const createSupabaseServerClient = createServerSupabaseClient;

// Export as createServerClient for backward compatibility
export const createServerClient = createServerSupabaseClient;
