/**
 * POST /api/employment/confirm-match
 * Confirm or reject an employment match. User must be one of the matched users.
 * Updates employment_matches.match_status; on confirmed, recalculates trust score for both users and logs to audit_logs.
 * No direct client DB update of match_status — API only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";
import { logAudit } from "@/lib/dispute-audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(["confirmed", "rejected"]),
});

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { matchId, status } = parsed.data;
    const sb = getSupabaseServer() as any;
    const userId = session.user.id;

    const { data: match, error: fetchErr } = await sb
      .from("employment_matches")
      .select("id, employment_record_id, matched_user_id, match_status")
      .eq("id", matchId)
      .single();

    if (fetchErr || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const { data: rec } = await sb
      .from("employment_records")
      .select("user_id")
      .eq("id", match.employment_record_id)
      .single();

    const recordOwnerId = rec?.user_id;
    const matchedUserId = match.matched_user_id;
    const isRecordOwner = recordOwnerId === userId;
    const isMatchedUser = matchedUserId === userId;

    if (!isRecordOwner && !isMatchedUser) {
      return NextResponse.json(
        { error: "Forbidden: You are not part of this match" },
        { status: 403 }
      );
    }

    if (match.match_status !== "pending") {
      return NextResponse.json(
        { error: "Match is already confirmed or rejected" },
        { status: 400 }
      );
    }

    const { error: updateErr } = await sb
      .from("employment_matches")
      .update({ match_status: status })
      .eq("id", matchId);

    if (updateErr) {
      console.error("[confirm-match] update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    await logAudit({
      entityType: "employment_match",
      entityId: matchId,
      changedBy: userId,
      oldValue: { match_status: match.match_status },
      newValue: { match_status: status },
      changeReason: status === "confirmed" ? "User confirmed overlap" : "User rejected overlap",
    });

    if (status === "confirmed") {
      await recalculateTrustScore(recordOwnerId, { reason: "employment_verified" });
      await recalculateTrustScore(matchedUserId, { reason: "employment_verified" });
    }

    return NextResponse.json({ success: true, status });
  } catch (e) {
    console.error("[confirm-match] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
