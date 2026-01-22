// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient as createSupabaseSSRClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

// Wrap everything in a function - no top-level await
export const createSupabaseServerClient = async () => {
  // In Next.js 16, cookies() is async and must be awaited
  const cookieStore = await cookies();

  return createSupabaseSSRClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
