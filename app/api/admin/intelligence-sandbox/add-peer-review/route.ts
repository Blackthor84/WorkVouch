/**
 * POST /api/admin/intelligence-sandbox/add-peer-review
 * Adds a peer review between two sandbox employees. Requires sandbox_id. Uses real intelligence.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import type { SimulationContext } from "@/lib/simulation/types";
import type { Database } from "@/types/database";

type EmploymentRecordRow = Database["public"]["Tables"]["employment_records"]["Row"];
type EmploymentMatchRow = Database["public"]["Tables"]["employment_matches"]["Row"];

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const reviewerUserId = body.reviewerUserId as string;
    const reviewedUserId = body.reviewedUserId as string;
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const comment = (body.comment as string) || "";

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }
    if (!reviewerUserId || !reviewedUserId || reviewerUserId === reviewedUserId) {
      return NextResponse.json({ error: "reviewerUserId and reviewedUserId required and must differ" }, { status: 400 });
    }

    const sandbox = await validateSandboxForWrite(sandboxId, adminId);
    const context: SimulationContext = { expiresAt: sandbox.ends_at, sandboxId };

    const supabase = getSupabaseServer();

    const { data: recsA } = await supabase
      .from("employment_records")
      .select("id, company_normalized")
      .eq("user_id", reviewerUserId)
      .eq("sandbox_id", sandboxId);
    const { data: recsB } = await supabase
      .from("employment_records")
      .select("id, company_normalized")
      .eq("user_id", reviewedUserId)
      .eq("sandbox_id", sandboxId);
    const listA = (recsA ?? []) as Pick<EmploymentRecordRow, "id" | "company_normalized">[];
    const listB = (recsB ?? []) as Pick<EmploymentRecordRow, "id" | "company_normalized">[];
    const recA = listA[0];
    const recB = listB[0];
    if (!recA || !recB) {
      return NextResponse.json({ error: "Both users need at least one sandbox employment record" }, { status: 400 });
    }
    if (recA.company_normalized !== recB.company_normalized) {
      return NextResponse.json({ error: "Users must share same company for peer review" }, { status: 400 });
    }

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
    const existingRow = existingMatch as Pick<EmploymentMatchRow, "id"> | null;
    if (existingRow?.id) {
      matchId = existingRow.id;
    } else {
      const { data: newMatch, error: matchErr } = await supabase
        .from("employment_matches")
        .insert({
          employment_record_id: recA.id,
          matched_user_id: reviewedUserId,
          overlap_start: overlapStartStr,
          overlap_end: overlapEndStr,
          match_status: "confirmed",
          sandbox_id: sandboxId,
        })
        .select("id")
        .single();
      if (matchErr || !newMatch) {
        return NextResponse.json({ error: matchErr?.message ?? "Failed to create match" }, { status: 400 });
      }
      matchId = (newMatch as Pick<EmploymentMatchRow, "id">).id;
    }

    const { error: refErr } = await supabase.from("employment_references").insert({
      employment_match_id: matchId,
      reviewer_id: reviewerUserId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment || null,
      sandbox_id: sandboxId,
    });
    if (refErr) {
      return NextResponse.json({ error: refErr.message }, { status: 400 });
    }

    await calculateUserIntelligence(reviewedUserId, context);

    return NextResponse.json({ ok: true, matchId, message: "Peer review added; intelligence recalculated." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
