/**
 * Fraud/integrity simulation: self-review, duplicate review attempts.
 * Expect API/DB to reject. Only when ENTERPRISE_SIMULATION_MODE=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();

    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string;
    const candidateId = body.candidateId as string;
    const matchId = body.employmentMatchId as string;
    if (!sessionId || !candidateId || !matchId) {
      return NextResponse.json(
        { error: "sessionId, candidateId, employmentMatchId required" },
        { status: 400 }
      );
    }

    const sb = getSupabaseServer() as any;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const results: { test: string; expected: string; got: string; passed: boolean }[] = [];

    const selfReview = await sb.from("employment_references").insert({
      employment_match_id: matchId,
      reviewer_id: candidateId,
      reviewed_user_id: candidateId,
      rating: 5,
      comment: "Self review attempt",
      is_simulation: true,
      simulation_session_id: sessionId,
      expires_at: expiresAt,
    });
    const selfBlocked = !!selfReview.error;
    results.push({
      test: "self_review_blocked",
      expected: "DB constraint or API rejects (reviewer_id != reviewed_user_id)",
      got: selfBlocked ? "rejected" : "accepted (BAD)",
      passed: selfBlocked,
    });

    const { data: existingRef } = await sb
      .from("employment_references")
      .select("reviewer_id, reviewed_user_id")
      .eq("employment_match_id", matchId)
      .limit(1)
      .maybeSingle();
    let duplicateBlocked = true;
    if (existingRef) {
      const row = existingRef as { reviewer_id: string; reviewed_user_id: string };
      const dup = await sb.from("employment_references").insert({
        employment_match_id: matchId,
        reviewer_id: row.reviewer_id,
        reviewed_user_id: row.reviewed_user_id,
        rating: 3,
        comment: "Duplicate attempt",
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
      });
      duplicateBlocked = !!dup.error;
    }
    results.push({
      test: "duplicate_review_prevented",
      expected: "UNIQUE(employment_match_id, reviewer_id) or API rejects",
      got: duplicateBlocked ? "rejected" : "accepted (BAD)",
      passed: duplicateBlocked,
    });

    const allPassed = results.every((r) => r.passed);
    return NextResponse.json({
      ok: true,
      integrity_results: {
        fraud_tests: results,
        self_review_blocked: results.find((r) => r.test === "self_review_blocked")?.passed ?? false,
        duplicate_prevented: results.find((r) => r.test === "duplicate_review_prevented")?.passed ?? false,
        all_passed: allPassed,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
