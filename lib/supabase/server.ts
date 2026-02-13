import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Use in protected API routes when session is missing. */
export function upgradeRequired401() {
  return NextResponse.json({ error: "🚨 Upgrade Required" }, { status: 401 });
}

/**
 * Single request-scoped server Supabase client (cookie-based session).
 * Use in route handlers and server actions. Do not share across requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore errors in edge runtime
          }
        },
      },
    }
  );
}

/** @deprecated Use createSupabaseServerClient — kept for backward compatibility. */
export async function createServerSupabase() {
  return createSupabaseServerClient();
}

/** @deprecated Use createSupabaseServerClient — kept for backward compatibility. */
export async function getSupabaseServer() {
  return createSupabaseServerClient();
}
