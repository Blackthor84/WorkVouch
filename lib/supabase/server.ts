/**
 * Next.js App Router server Supabase client.
 * Use in server components and API routes. For auth, use getUser() from @/lib/auth/getUser (getUser() calls supabase.auth.getUser(), not getSession()).
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );
}

/** Alias for createServerSupabaseClient. Use in server components and API routes. */
export { createServerSupabaseClient as createClient };
