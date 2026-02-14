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

    const overlapStart = new Date();
    overlapStart.setMonth(overlapStart.getMonth() - 6);
    const overlapEnd = new Date();
    const overlapStartStr = overlapStart.toISOString().slice(0, 10);
    const overlapEndStr = overlapEnd.toISOString().slice(0, 10);

    let matchId: string;
    const { data: existingMatch } = await supabase
      .from("employment_matches")
      .select("id")
      .eq("employment_record_id", recA.id)
      .eq("matched_user_id", reviewedUserId)
      .maybeSingle();
    if (existingMatch && (existingMatch as { id: string }).id) {
      matchId = (existingMatch as { id: string }).id;
    } else {
      const { data: newMatch, error: matchErr } = await supabase
        .from("employment_matches")
        .insert({
          employment_record_id: recA.id,
          matched_user_id: reviewedUserId,
          overlap_start: overlapStartStr,
          overlap_end: overlapEndStr,
          match_status: "confirmed",
          is_simulation: true,
          simulation_session_id: sessionId,
          expires_at: expiresAt,
        })
        .select("id")
        .single();
      if (matchErr || !newMatch) return NextResponse.json({ error: matchErr?.message ?? "Failed to create match" }, { status: 500 });
      matchId = (newMatch as { id: string }).id;
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
