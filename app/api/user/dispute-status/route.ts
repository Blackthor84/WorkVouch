/**
 * GET /api/user/dispute-status
 * Returns open disputes, current trust score, and whether trust score is under review.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getSupabaseSession } from "@/lib/supabase/server";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const effectiveUserId = effective.id;

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

    const baseData = {
      openDisputes: openDisputes ?? [],
      currentTrustScore: trustRow?.score ?? 0,
      underReview: profile?.trust_score_under_review ?? false,
      activeDisputeCount: profile?.active_dispute_count ?? 0,
    };
    const { session } = await getSupabaseSession();
    return NextResponse.json(applyScenario(baseData, session?.impersonation));
  } catch (e) {
    console.error("[dispute-status] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
