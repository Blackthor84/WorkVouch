import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const ALLOWED_REDIRECT_PATHS = ["/admin", "/dashboard"] as const;
const DEFAULT_REDIRECT = "/dashboard";

/**
 * Auth callback: reads Supabase session from cookies (or exchanges code for session).
 * Redirects by role. Never exposes access_token or refresh_token in URL.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const supabase = await createServerSupabase();

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const userId = session.user.id;
  const { data: profileRow } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  let role: string | null = (profileRow as { role?: string } | null)?.role ?? null;
  if (role !== "admin" && role !== "superadmin" && role !== "employer" && role !== "user") {
    const { data: roles } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const list = (roles ?? []) as { role: string }[];
    if (list.length > 0) {
      role = list.find((r) => r.role === "superadmin")?.role
        ?? list.find((r) => r.role === "admin")?.role
        ?? list.find((r) => r.role === "employer")?.role
        ?? list[0]?.role
        ?? "user";
    } else {
      role = role ?? "user";
    }
  }

  const targetPath =
    role === "superadmin" || role === "admin"
      ? "/admin"
      : DEFAULT_REDIRECT;

  return NextResponse.redirect(`${origin}${targetPath}`);
}
