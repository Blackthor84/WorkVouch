/**
 * Server-only Supabase client creation
 * ✅ Only import this file in server components or API routes
 * ✅ Declare supabase once per function and reuse for all queries
 * ✅ Uses centralized env validation
 */
import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClientSSR } from "@supabase/ssr";
import { Database } from "@/types/database";
import { env } from "@/lib/env";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  // Use centralized env - these are validated at runtime when actually used
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in Vercel Project Settings → Environment Variables."
    );
  }

  return createSupabaseServerClientSSR<Database>(
    supabaseUrl,
    supabaseAnonKey,
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
};

// Export as createServerClient for backward compatibility
export const createServerClient = createSupabaseServerClient;
