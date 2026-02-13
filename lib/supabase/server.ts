import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options ?? {});
        },
        remove(name, options) {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Use in protected API routes when session is missing. */
export function upgradeRequired401() {
  return NextResponse.json({ error: "🚨 Upgrade Required" }, { status: 401 });
}

/** @deprecated Use supabaseServer */
export const createSupabaseServerClient = supabaseServer;

/** @deprecated Use supabaseServer */
export const createServerSupabase = supabaseServer;

/** @deprecated Use supabaseServer */
export const getSupabaseServer = supabaseServer;
