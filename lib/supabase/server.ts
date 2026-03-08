import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Main server Supabase client
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

/**
 * Backwards compatibility for existing imports
 */
export async function createServerSupabaseClient() {
  return createClient();
}
