import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getEffectiveUserIdWithAuth } from "@/lib/server/effectiveUserId";

export const runtime = "nodejs";

const IMPERSONATED_USER_ID_COOKIE = "impersonatedUserId";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * Checks impersonatedUserId cookie first so we never return 401 during active impersonation
 * (avoids infinite retry loops when session is stale but cookie is still set).
 */
export async function GET() {
  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value?.trim();

  const supabase = await supabaseServer();

  // If impersonation cookie is set, return that profile (no auth required) so UI never gets 401 during impersonation.
  if (impersonatedUserId) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, onboarding_completed")
      .eq("id", impersonatedUserId)
      .single();

    if (!error && profile) {
      const row = profile as { id: string; email: string | null; full_name: string; role: string | null; onboarding_completed?: boolean };
      return NextResponse.json({
        id: row.id,
        email: row.email ?? undefined,
        full_name: row.full_name,
        role: row.role ?? "user",
        onboarding_complete: Boolean(row.onboarding_completed),
      });
    }
    // Profile not found for impersonated id — fall through to normal auth
  }

  const ctx = await getEffectiveUserIdWithAuth();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { effectiveUserId } = ctx;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, onboarding_completed")
    .eq("id", effectiveUserId)
    .single();

  if (error || !profile) {
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
