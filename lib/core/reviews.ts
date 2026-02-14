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
 * Submit a peer review for a confirmed match. Inserts employment_references, then recalculates trust score for reviewee.
 * Caller must have validated session; match must be confirmed. Same logic in sandbox and production.
 */
export async function submitReview(
  input: SubmitReviewInput,
  options?: { supabase?: SupabaseClient; auditLog?: (payload: { entityType: string; entityId: string; changedBy: string; newValue: unknown; changeReason: string }) => Promise<void> }
): Promise<SubmitReviewResult> {
  const sb = options?.supabase ?? getSupabaseServer();
  const { employment_match_id, reviewer_id, rating, comment } = input;

  const { data: match, error: matchErr } = await sb
    .from("employment_matches")
    .select("id, employment_record_id, matched_user_id, match_status")
    .eq("id", employment_match_id)
    .single();

  if (matchErr || !match) {
    return { ok: false, error: "Match not found", status: 404 };
  }
  const m = match as { match_status: string; employment_record_id: string; matched_user_id: string };
  if (m.match_status !== "confirmed") {
    return { ok: false, error: "Only confirmed matches can receive references", status: 403 };
  }

  const { data: rec } = await sb
    .from("employment_records")
    .select("user_id")
    .eq("id", m.employment_record_id)
    .single();
  const recordOwnerId = (rec as { user_id: string } | null)?.user_id;
  const matchedUserId = m.matched_user_id;
  const reviewedUserId = recordOwnerId === reviewer_id ? matchedUserId : recordOwnerId!;
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
    console.error("[core/reviews] insert error:", insertErr);
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
}
