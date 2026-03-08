import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
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
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    const emailConfirmedAt = (user as { email_confirmed_at?: string | null }).email_confirmed_at;
    if (!emailConfirmedAt) {
      return NextResponse.redirect(`${origin}/verify-email`);
    }

    const supabase = await createClient();
    const { data, error } = await admin.from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (data?.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "") as string;
    const path = await getPostLoginRedirect({ role });
    return NextResponse.redirect(`${origin}${path}`);
  } catch {
    return NextResponse.redirect(`${origin}/onboarding`);
  }
}
