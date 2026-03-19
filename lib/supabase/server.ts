import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Main server Supabase client. Uses cookie getAll/setAll so the authenticated
 * session is read from the request and can be refreshed (setAll) when needed.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component where cookies are read-only; ignore.
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
