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
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
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
export async function createSupabaseServerClient() {
  return supabaseServer();
}

/** @deprecated Use supabaseServer */
export const createServerSupabase = createSupabaseServerClient;

/** @deprecated Use supabaseServer */
export const getSupabaseServer = createSupabaseServerClient;
