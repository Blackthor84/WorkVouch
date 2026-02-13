/**
 * POST /api/employment-references
 * Submit a reference for a confirmed employment match. Rate limited. Zod validated.
 * Only confirmed matches; unique (employment_match_id, reviewer_id). Recalculates trust score.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";
import { logAudit } from "@/lib/dispute-audit";
import { processReviewIntelligence } from "@/lib/intelligence/processReviewIntelligence";
import { runAnomalyChecksAfterReview } from "@/lib/admin/runAnomalyChecks";
import { withRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  employment_match_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = withRateLimit(req, {
      userId: session.user.id,
      ...RATE_LIMITS.employmentReferences,
      prefix: "rl:ref:",
    });
    if (!rl.allowed) return rl.response;

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const { employment_match_id, rating, comment } = parsed.data;

    const { data: match, error: matchErr } = await sb
      .from("employment_matches")
      .select("id, employment_record_id, matched_user_id, match_status")
      .eq("id", employment_match_id)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.match_status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed matches can receive references" },
        { status: 403 }
      );
    }

    const { data: rec } = await sb
      .from("employment_records")
      .select("user_id")
      .eq("id", match.employment_record_id)
      .single();

    const recordOwnerId = rec?.user_id;
    const matchedUserId = match.matched_user_id;
    const reviewerId = session.user.id;
    const reviewedUserId = recordOwnerId === reviewerId ? matchedUserId : recordOwnerId;

    if (reviewedUserId === reviewerId) {
      return NextResponse.json({ error: "Cannot reference yourself" }, { status: 400 });
    }

    const { data: existing } = await sb
      .from("employment_references")
      .select("id")
      .eq("employment_match_id", employment_match_id)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You have already left a reference for this match" }, { status: 409 });
    }

    const reliability_score = rating * 20;

    const { data: ref, error: insertErr } = await sb
      .from("employment_references")
      .insert({
        employment_match_id,
        reviewer_id: reviewerId,
        reviewed_user_id: reviewedUserId,
        rating,
        reliability_score,
        comment: comment ?? null,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[employment-references] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save reference" }, { status: 500 });
    }

    await logAudit({
      entityType: "reference",
      entityId: ref?.id ?? employment_match_id,
      changedBy: reviewerId,
      newValue: { employment_match_id, reviewed_user_id: reviewedUserId, rating },
      changeReason: "Reference submitted for confirmed match",
    });

    await recalculateTrustScore(reviewedUserId, {
      triggeredBy: session.user.id,
      reason: "peer_review_added",
    });

    const intelResult = await processReviewIntelligence(ref?.id ?? "");
    if (!intelResult.ok) {
      console.error("[employment-references] processReviewIntelligence failed:", intelResult.error);
      return NextResponse.json(
        {
          error: "Reference saved but intelligence processing failed",
          warning: "Score update may be delayed; retry later.",
          id: ref?.id,
        },
        { status: 500 }
      );
    }

    await runAnomalyChecksAfterReview(reviewedUserId);

    return NextResponse.json({ id: ref?.id, success: true });
  } catch (e) {
    console.error("[employment-references] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
