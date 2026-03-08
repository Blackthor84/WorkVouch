// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/user/dispute-status
 * Returns open disputes, current trust score, and whether trust score is under review.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getEffectiveUser } from "@/lib/auth";
import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const effectiveUserId = effective.id;

    const { data: openDisputes } = await admin
      .from("disputes")
      .select("id, dispute_type, related_record_id, status, created_at")
      .eq("user_id", effectiveUserId)
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: false });

    const { data: trustRow } = await admin
      .from("trust_scores")
      .select("score")
      .eq("user_id", effectiveUserId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const disputeList = openDisputes ?? [];
    const baseData = {
      openDisputes: disputeList,
      currentTrustScore: trustRow?.score ?? 0,
      underReview: false,
      activeDisputeCount: disputeList.length,
    };
    const authUser = await getUser();
    return NextResponse.json(applyScenario(baseData, (authUser as any)?.user_metadata?.impersonation));
  } catch (e) {
    console.error("[dispute-status] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
