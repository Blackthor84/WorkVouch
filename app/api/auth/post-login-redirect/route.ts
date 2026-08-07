import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginRedirect } from "@/lib/auth/getPostLoginRedirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/post-login-redirect
 * Returns canonical post-login path from profiles.role (used by LoginClient).
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailConfirmedAt = (user as { email_confirmed_at?: string | null }).email_confirmed_at;
    if (!emailConfirmedAt) {
      return NextResponse.json({ path: "/verify-email" });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = error || !data ? "" : ((data as { role?: string | null }).role ?? "");
    const path = await getPostLoginRedirect({ id: user.id, role });
    return NextResponse.json({ path });
  } catch (e) {
    console.error("[post-login-redirect]", e);
    return NextResponse.json({ error: "Redirect resolution failed" }, { status: 500 });
  }
}
