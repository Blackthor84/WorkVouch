/**
 * POST /api/admin/sandbox/rewind-trust-score
 * Sandbox-only. Set trust score for a user to a value (for testing rewind).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdminContext();
  if (APP_MODE !== "sandbox" || !admin.isSandbox) return adminForbiddenResponse();

  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string; score?: number };
    const userId = body.userId;
    const score = typeof body.score === "number" ? Math.max(0, Math.min(100, body.score)) : 0;
    if (!userId || typeof userId !== "string") return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    const sb = getSupabaseServer();
    const { error } = await sb.from("trust_scores").upsert({
      user_id: userId,
      score,
      job_count: 0,
      reference_count: 0,
      average_rating: 0,
      calculated_at: new Date().toISOString(),
      version: "sandbox-rewind-" + Date.now(),
    }, { onConflict: "user_id" });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, userId, score });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
