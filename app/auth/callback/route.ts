import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";

export const runtime = "nodejs";

function isProfileComplete(profile: Record<string, unknown> | null, role: string): boolean {
  if (!profile) return false;
  const r = String(role || "").toLowerCase();
  if (r === "employer") {
    return (profile.onboarding_completed as boolean) === true;
  }
  const hasName = Boolean((profile.full_name as string)?.trim());
  const hasIndustry = Boolean((profile.industry as string)?.trim());
  return hasName && hasIndustry;
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.redirect(`${origin}/login?error=misconfigured`);
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, full_name, industry")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      const role = (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "";
      const path = getPostLoginRedirect({ role, profile_complete: false });
      return NextResponse.redirect(`${origin}${path}`);
    }

    const role = data.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "";
    const profile_complete = isProfileComplete(data, role);
    const path = getPostLoginRedirect({ role, profile_complete });
    return NextResponse.redirect(`${origin}${path}`);
  } catch {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
