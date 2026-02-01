/**
 * Trust Score Engine — server-side only. Never calculate on frontend.
 * Formula: Base = (verified_employments * 15) + (avg_rating * 10) + (reference_count * 5) - (fraud_flags * 25)
 * Capped 0–100. Recalculate on: reference submitted, match confirmed, fraud flag added.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const MAX_SCORE = 100;
const MIN_SCORE = 0;

export interface TrustScoreInputs {
  employmentVerifiedCount: number;
  averageReferenceRating: number;
  referenceCount: number;
  fraudFlagsCount: number;
}

/**
 * Compute raw score from inputs (0–100).
 */
export function computeTrustScore(inputs: TrustScoreInputs): number {
  const base =
    inputs.employmentVerifiedCount * 15 +
    inputs.averageReferenceRating * 10 +
    inputs.referenceCount * 5 -
    inputs.fraudFlagsCount * 25;
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(base)));
}

/**
 * Recalculate and persist trust score for a user. Call after:
 * - reference submitted (employment_references)
 * - match confirmed (employment_matches)
 * - fraud flag added (fraud_flags)
 */
export async function recalculateTrustScore(userId: string): Promise<{ score: number }> {
  const sb = getSupabaseServer() as any;

  const { count: verifiedCount } = await sb
    .from("employment_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("verification_status", "verified");
  const employmentVerifiedCount = verifiedCount ?? 0;

  const { data: refs } = await sb
    .from("employment_references")
    .select("rating")
    .eq("reviewed_user_id", userId);
  const refList = (refs ?? []) as { rating: number }[];
  const referenceCount = refList.length;
  const averageReferenceRating =
    referenceCount > 0 ? refList.reduce((s, r) => s + r.rating, 0) / referenceCount : 0;

  const { count: fraudCount } = await sb
    .from("fraud_flags")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const fraudFlagsCount = fraudCount ?? 0;

  const inputs: TrustScoreInputs = {
    employmentVerifiedCount,
    averageReferenceRating,
    referenceCount,
    fraudFlagsCount,
  };
  const score = computeTrustScore(inputs);

  const { error } = await sb.from("trust_scores").upsert(
    {
      user_id: userId,
      score,
      job_count: employmentVerifiedCount,
      reference_count: referenceCount,
      average_rating: averageReferenceRating,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[trustScore] upsert error:", error);
  }

  return { score };
}
