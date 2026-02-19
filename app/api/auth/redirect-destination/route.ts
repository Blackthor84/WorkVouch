import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/redirect-destination
 * Post-login redirect from profiles.role: employee → /dashboard/employee, employer → /dashboard/employer, admin → /admin, default → /onboarding.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    const emailConfirmedAt = (user as { email_confirmed_at?: string | null }).email_confirmed_at;
    if (!emailConfirmedAt) {
      return NextResponse.redirect(`${origin}/verify-email`);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (data?.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "") as string;
    const path = getPostLoginRedirect({ role });
    return NextResponse.redirect(`${origin}${path}`);
  } catch {
    return NextResponse.redirect(`${origin}/onboarding`);
  }
}
