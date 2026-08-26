import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";
import { resolvePostAuthRedirectPath } from "@/lib/auth/safeReturnTo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const returnTo = searchParams.get("returnTo");

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.redirect(`${origin}/login?error=misconfigured`);
    }

    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = error || !data ? "" : ((data as { role?: string | null }).role ?? "");
    const defaultPath = await getPostLoginRedirect({ id: user.id, role });
    const path = resolvePostAuthRedirectPath(returnTo, defaultPath);
    return NextResponse.redirect(`${origin}${path}`);
  } catch {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
