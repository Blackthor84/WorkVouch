import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Server Supabase client for App Router (Server Components, Route Handlers, Server Actions).
 * Uses cookies() from next/headers — consistent, no manual cookie parsing.
 * Cookie get/set/remove support session refresh when middleware has run.
 */
export async function createServerSupabase(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // set can throw in Server Component render; middleware handles refresh
          }
        },
        remove(name: string, options: { path?: string }) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // remove can throw in Server Component render
          }
        },
      },
    }
  );
  return client;
}
