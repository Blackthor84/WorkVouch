import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Main server Supabase client. Cookies passed via getAll/setAll so the
 * authenticated session is read from the request and can be refreshed.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component or read-only context; ignore.
          }
        },
      },
    }
  );
}

/**
 * Backwards compatibility for existing imports
 */
export async function createServerSupabaseClient() {
  return createClient();
}
