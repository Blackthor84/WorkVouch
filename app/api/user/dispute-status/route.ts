/**
 * GET /api/user/dispute-status
 * Returns open disputes, current trust score, and whether trust score is under review.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUserId } from "@/lib/server/effectiveUserId";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseServer() as any;

    const { data: profile } = await sb
      .from("profiles")
      .select("active_dispute_count, trust_score_under_review")
      .eq("id", effectiveUserId)
      .single();

    const { data: openDisputes } = await sb
      .from("disputes")
      .select("id, dispute_type, related_record_id, status, created_at")
      .eq("user_id", effectiveUserId)
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: false });

    const { data: trustRow } = await sb
      .from("trust_scores")
      .select("score")
      .eq("user_id", effectiveUserId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      openDisputes: openDisputes ?? [],
      currentTrustScore: trustRow?.score ?? 0,
      underReview: profile?.trust_score_under_review ?? false,
      activeDisputeCount: profile?.active_dispute_count ?? 0,
    });
  } catch (e) {
    console.error("[dispute-status] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
