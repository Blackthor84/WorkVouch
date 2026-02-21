import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getEffectiveUserIdWithAuth } from "@/lib/server/effectiveUserId";

export const runtime = "nodejs";

/**
 * GET /api/user/me — current user (or effective user when impersonating).
 * All data queries use effectiveUserId = impersonated_user_id ?? auth.uid().
 */
export async function GET() {
  const ctx = await getEffectiveUserIdWithAuth();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { effectiveUserId, authUserId } = ctx;
  // Temporary debug: confirm impersonation is active server-side
  console.log("AUTH USER:", authUserId);
  console.log("EFFECTIVE USER:", effectiveUserId);

  const supabase = await supabaseServer();
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
