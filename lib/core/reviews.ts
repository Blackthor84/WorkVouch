/**
 * Core review submission. Single execution path.
 * Store raw → recalculate trust score deterministically. No env branches.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubmitReviewInput = {
  employment_match_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string | null;
};

export type SubmitReviewResult =
  | { ok: true; referenceId: string; reviewedUserId: string }
  | { ok: false; error: string; status: 400 | 403 | 404 | 409 | 500 };

/**
 * Submit a peer review for a confirmed match. employment_matches does not exist;
 * match validation is skipped; references use coworker_matches flow elsewhere.
 * Fail soft: return 404 if match/reference flow is unavailable.
 */
export async function submitReview(
  input: SubmitReviewInput,
  options?: { supabase?: SupabaseClient; auditLog?: (payload: { entityType: string; entityId: string; changedBy: string; newValue: unknown; changeReason: string }) => Promise<void> }
): Promise<SubmitReviewResult> {
  try {
    const sb = options?.supabase ?? getSupabaseServer();
    const { employment_match_id, reviewer_id, rating, comment } = input;

    const { data: match, error: matchErr } = await sb
      .from("coworker_matches")
      .select("id, user1_id, user2_id")
      .eq("id", employment_match_id)
      .single();

    if (matchErr || !match) {
      return { ok: false, error: "Match not found", status: 404 };
    }
    const m = match as { user1_id: string; user2_id: string };
    const reviewedUserId = m.user1_id === reviewer_id ? m.user2_id : m.user1_id;
    if (reviewedUserId === reviewer_id) {
      return { ok: false, error: "Cannot reference yourself", status: 400 };
    }

    const { data: existing } = await sb
      .from("employment_references")
      .select("id")
      .eq("employment_match_id", employment_match_id)
      .eq("reviewer_id", reviewer_id)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: "You have already left a reference for this match", status: 409 };
    }

    // Collusion-resistant: reciprocal verification disallowed. If the reviewed user already left a reference for this reviewer on the same match, reject.
    const { data: reciprocal } = await sb
      .from("employment_references")
      .select("id")
      .eq("employment_match_id", employment_match_id)
      .eq("reviewer_id", reviewedUserId)
      .eq("reviewed_user_id", reviewer_id)
      .maybeSingle();
    if (reciprocal) {
      return { ok: false, error: "Reciprocal verification is not allowed for this match", status: 403 };
    }

    const reliability_score = rating * 20;
    const sentiment = Math.max(-1, Math.min(1, (rating - 3) / 2));
    const trust_weight = 1.0;

    const { data: ref, error: insertErr } = await sb
      .from("employment_references")
      .insert({
        employment_match_id,
        reviewer_id,
        reviewed_user_id: reviewedUserId,
        rating,
        reliability_score,
        comment: comment ?? null,
        sentiment,
        trust_weight,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.warn("[core/reviews] insert error (optional)", insertErr);
      return { ok: false, error: "Failed to save reference", status: 500 };
    }

    if (options?.auditLog) {
      await options.auditLog({
        entityType: "reference",
        entityId: (ref as { id: string })?.id ?? employment_match_id,
        changedBy: reviewer_id,
        newValue: { employment_match_id, reviewed_user_id: reviewedUserId, rating },
        changeReason: "Reference submitted for confirmed match",
      });
    }

    await recalculateTrustScore(reviewedUserId, {
      triggeredBy: reviewer_id,
      reason: "peer_review_added",
    });

    return { ok: true, referenceId: (ref as { id: string }).id, reviewedUserId };
  } catch (e) {
    console.warn("Optional submitReview failed", e);
    return { ok: false, error: "Match not found", status: 404 };
  }
}
