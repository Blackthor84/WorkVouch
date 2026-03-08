import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Official server client (single place). Uses cookies() for auth; use getUser() for auth, not session.
 * Next.js App Router: cookies() is async, so createClient is async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/** Alias for createClient. Use in server components and API routes. */
export async function createServerSupabaseClient() {
  return createClient();
}
