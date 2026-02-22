import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getEffectiveUserIdFromCookies, getEffectiveUserIdWithAuth } from "@/lib/server/effectiveUserId";

export const runtime = "nodejs";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * Uses effective user ID from cookies first (no Supabase auth required for impersonation/sandbox),
 * so we never return 401 during active impersonation (stops infinite retry loops).
 */
export async function GET() {
  const effectiveUserIdFromCookies = await getEffectiveUserIdFromCookies();
  const supabase = await supabaseServer();

  const effectiveUserId =
    effectiveUserIdFromCookies ??
    (await getEffectiveUserIdWithAuth())?.effectiveUserId ??
    null;

  if (!effectiveUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
