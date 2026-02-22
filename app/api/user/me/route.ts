import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export const runtime = "nodejs";

const IMPERSONATED_USER_ID_COOKIE = "impersonatedUserId";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * Resolves effectiveUserId = impersonatedUserId ?? realAuthUserId.
 * Does not require Supabase auth when impersonatedUserId cookie exists (stops infinite retry loops).
 * Returns 401 only if no effectiveUserId or no profile exists.
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
    console.log("[api/user/me] No effectiveUserId: no impersonatedUserId cookie and no auth");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[api/user/me] effectiveUserId:", effectiveUserId, impersonatedUserId ? "(impersonated)" : "(real auth)");

  const supabase = await supabaseServer();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, onboarding_completed")
    .eq("id", effectiveUserId)
    .single();

  if (error || !profile) {
    console.log("[api/user/me] No profile for effectiveUserId:", effectiveUserId, error?.message ?? "not found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = profile as { id: string; email: string | null; full_name: string; role: string | null; onboarding_completed?: boolean };
  return NextResponse.json({
    id: row.id,
    email: row.email ?? undefined,
    full_name: row.full_name,
    role: row.role ?? "user",
    onboarding_complete: Boolean(row.onboarding_completed),
  });
}
