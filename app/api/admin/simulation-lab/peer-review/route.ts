/**
 * Simulation Lab: add peer review between two simulated users.
 * Finds or creates employment_match, inserts employment_references, reruns intelligence.
 * Never triggers emails or webhooks.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin, validateSessionForWrite } from "@/lib/simulation-lab";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const reviewerUserId = body.reviewerUserId as string;
    const reviewedUserId = body.reviewedUserId as string;
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const comment = (body.comment as string) || "";
    const sessionId = body.sessionId as string;

    if (!reviewerUserId || !reviewedUserId || reviewerUserId === reviewedUserId)
      return NextResponse.json({ error: "reviewerUserId and reviewedUserId required and must differ" }, { status: 400 });
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await validateSessionForWrite(sessionId, adminId);
    const expiresAt = session.expires_at;
    const simulationContext = { simulationSessionId: sessionId, expiresAt };

    const supabase = getSupabaseServer();

    const { data: recsA } = await supabase
      .from("employment_records")
      .select("id, user_id, company_normalized")
      .eq("user_id", reviewerUserId)
      .eq("is_simulation", true);
    const { data: recsB } = await supabase
      .from("employment_records")
      .select("id, user_id, company_normalized")
      .eq("user_id", reviewedUserId)
      .eq("is_simulation", true);
    const listA = Array.isArray(recsA) ? recsA : [];
    const listB = Array.isArray(recsB) ? recsB : [];
    const recA = listA[0] as { id: string; company_normalized: string } | undefined;
    const recB = listB[0] as { id: string; company_normalized: string } | undefined;
    if (!recA || !recB) return NextResponse.json({ error: "Both users need at least one simulated employment record" }, { status: 400 });
    if (recA.company_normalized !== recB.company_normalized)
      return NextResponse.json({ error: "Users must share same company for peer review" }, { status: 400 });

    let matchId: string | null = null;
    try {
      const { data: d1 } = await supabase
        .from("coworker_matches")
        .select("id")
        .eq("user1_id", reviewerUserId)
        .eq("user2_id", reviewedUserId)
        .maybeSingle();
      if ((d1 as { id?: string } | null)?.id) {
        matchId = (d1 as { id: string }).id;
      } else {
        const { data: d2 } = await supabase
          .from("coworker_matches")
          .select("id")
          .eq("user1_id", reviewedUserId)
          .eq("user2_id", reviewerUserId)
          .maybeSingle();
        if ((d2 as { id?: string } | null)?.id) matchId = (d2 as { id: string }).id;
      }
    } catch (e) {
      console.warn("Optional simulation-lab peer-review match query failed", e);
    }
    if (!matchId) {
      return NextResponse.json(
        { error: "No existing coworker match found; employment_matches does not exist" },
        { status: 503 }
      );
    }

    const { error: refErr } = await supabase.from("employment_references").insert({
      employment_match_id: matchId,
      reviewer_id: reviewerUserId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment || null,
      is_simulation: true,
      simulation_session_id: sessionId,
      expires_at: expiresAt,
    });
    if (refErr) return NextResponse.json({ error: refErr.message }, { status: 500 });

    await calculateUserIntelligence(reviewedUserId, simulationContext);

    return NextResponse.json({ ok: true, matchId, message: "Peer review added; intelligence recalculated." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
