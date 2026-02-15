import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * GET /api/auth/redirect-destination
 * Returns 302 to /admin, /onboarding, or /dashboard based on role and profile.
 * Use after client-side sign-in so the server can read session and redirect once.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    return NextResponse.redirect(`${origin}/dashboard`);
  }
}
