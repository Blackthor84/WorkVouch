import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export const runtime = "nodejs";

const IMPERSONATED_USER_ID_COOKIE = "impersonatedUserId";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * Resolves effectiveUserId = impersonatedUserId ?? realAuthUserId.
 * Queries profiles by user_id only; does not reference profiles.id.
 * Does not require Supabase auth when impersonatedUserId cookie exists (stops infinite retry loops).
 * Returns 401 only if no effectiveUserId or no profile exists (after optional auto-create for impersonated).
 */
export async function GET() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value?.trim() ?? null;

  let realAuthUserId: string | null = null;
  if (!impersonatedUserId) {
    const authed = await getAuthedUser();
    realAuthUserId = authed?.user?.id ?? null;
  }

  const effectiveUserId = impersonatedUserId ?? realAuthUserId;

  if (!effectiveUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[api/user/me] effectiveUserId:", effectiveUserId, impersonatedUserId ? "(impersonated)" : "(real auth)");

  const supabase = await supabaseServer();
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, email, full_name, role, onboarding_completed")
    .eq("user_id", effectiveUserId)
    .maybeSingle();

  if (impersonatedUserId && (!profile || error)) {
    const { error: insertErr } = await supabase.from("profiles").insert({
      user_id: effectiveUserId,
      full_name: "Impersonated User",
      email: `${effectiveUserId}@impersonated.placeholder`,
      role: "user",
      visibility: "private",
      flagged_for_fraud: false,
    });
    if (!insertErr) {
      console.log("[api/user/me] profile created for impersonated user:", effectiveUserId);
      const res = await supabase
        .from("profiles")
        .select("user_id, email, full_name, role, onboarding_completed")
        .eq("user_id", effectiveUserId)
        .maybeSingle();
      profile = res.data;
      error = res.error;
    }
  }

  if (error || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = profile as { user_id: string; email: string | null; full_name: string; role: string | null; onboarding_completed?: boolean };
  return NextResponse.json({
    id: row.user_id,
    email: row.email ?? undefined,
    full_name: row.full_name,
    role: row.role ?? "user",
    onboarding_complete: Boolean(row.onboarding_completed),
  });
}
