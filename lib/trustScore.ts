/**
 * Trust Score Engine — server-side only. Never calculate on frontend.
 * Single portable core score per user (0–100). Stored in trust_scores.
 * Industry weighting is internal/UI-only; no per-industry score persistence.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { coreWeights, type IndustryWeights } from "@/lib/trustScoreWeights";

const MAX_SCORE = 100;
const MIN_SCORE = 0;

/** Raw component values fetched from DB (before normalization). */
export interface TrustScoreComponents {
  verifiedEmployments: number;
  totalVerifiedYears: number;
  averageReferenceRating: number;
  referenceCount: number;
  uniqueEmployersWithReferences: number;
  fraudFlagsCount: number;
}

/** Legacy shape for backward compatibility. */
export interface TrustScoreInputs {
  employmentVerifiedCount: number;
  averageReferenceRating: number;
  referenceCount: number;
  fraudFlagsCount: number;
}

/**
 * Normalize components to 0–100 range:
 * employment_score = min(verified_employments * 10, 40)
 * tenure_score = min(total_verified_years * 3, 30)
 * rating_score = avg_rating * 20
 * distribution_score = min(unique_employers_with_references * 10, 30)
 * reference_volume_score = min(reference_count * 5, 30)
 */
function normalizeScores(c: TrustScoreComponents): {
  employment: number;
  tenure: number;
  rating: number;
  distribution: number;
  referenceVolume: number;
} {
  return {
    employment: Math.min(c.verifiedEmployments * 10, 40),
    tenure: Math.min(c.totalVerifiedYears * 3, 30),
    rating: c.averageReferenceRating * 20,
    distribution: Math.min(c.uniqueEmployersWithReferences * 10, 30),
    referenceVolume: Math.min(c.referenceCount * 5, 30),
  };
}

/**
 * Compute weighted score from normalized components and fraud penalty.
 * fraud_penalty = fraud_flags * 25
 * final_score = clamp(weighted_sum - fraud_penalty, 0, 100)
 */
export function computeWeightedTrustScore(
  components: TrustScoreComponents,
  weights: IndustryWeights
): number {
  const n = normalizeScores(components);
  const weighted =
    n.employment * weights.employment +
    n.tenure * weights.tenure +
    n.rating * weights.rating +
    n.distribution * weights.distribution +
    n.referenceVolume * weights.referenceVolume;
  const fraudPenalty = components.fraudFlagsCount * 25;
  return Math.max(
    MIN_SCORE,
    Math.min(MAX_SCORE, Math.round(weighted - fraudPenalty))
  );
}

/**
 * Compute raw score from legacy inputs (0–100). Backward compatibility.
 */
export function computeTrustScore(inputs: TrustScoreInputs): number {
  const c: TrustScoreComponents = {
    verifiedEmployments: inputs.employmentVerifiedCount,
    totalVerifiedYears: 0,
    averageReferenceRating: inputs.averageReferenceRating,
    referenceCount: inputs.referenceCount,
    uniqueEmployersWithReferences: 0,
    fraudFlagsCount: inputs.fraudFlagsCount,
  };
  return computeWeightedTrustScore(c, coreWeights);
}

/**
 * Fetch raw trust score components for a user from DB.
 */
export async function getTrustScoreComponents(
  userId: string
): Promise<TrustScoreComponents> {
  const sb = getSupabaseServer();

  const { data: records } = await sb
    .from("employment_records")
    .select("start_date, end_date")
    .eq("user_id", userId)
    .eq("verification_status", "verified");
  const verifiedList = (records ?? []) as { start_date: string; end_date: string | null }[];
  const verifiedEmployments = verifiedList.length;
  const now = new Date();
  let totalVerifiedYears = 0;
  for (const r of verifiedList) {
    const start = new Date(r.start_date);
    const end = r.end_date ? new Date(r.end_date) : now;
    totalVerifiedYears += (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }

  const { data: refs } = await sb
    .from("employment_references")
    .select("rating, employment_match_id")
    .eq("reviewed_user_id", userId);
  const refList = (refs ?? []) as { rating: number; employment_match_id: string }[];
  const referenceCount = refList.length;
  const averageReferenceRating =
    referenceCount > 0
      ? refList.reduce((s, r) => s + r.rating, 0) / referenceCount
      : 0;

  let uniqueEmployersWithReferences = 0;
  if (refList.length > 0) {
    const matchIds = [...new Set(refList.map((r) => r.employment_match_id))];
    const { data: matches } = await sb
      .from("employment_matches")
      .select("employment_record_id")
      .in("id", matchIds);
    const matchesList = (matches ?? []) as { employment_record_id: string }[];
    const recordIds = matchesList.map((m) => m.employment_record_id);
    const { data: recs } = await sb
      .from("employment_records")
      .select("company_normalized")
      .eq("user_id", userId)
      .in("id", recordIds);
    const recsList = (recs ?? []) as { company_normalized: string }[];
    const distinctCompanies = new Set(recsList.map((r) => r.company_normalized));
    uniqueEmployersWithReferences = distinctCompanies.size;
  }

  const { count: fraudCount } = await sb
    .from("fraud_flags")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const fraudFlagsCount = fraudCount ?? 0;

  return {
    verifiedEmployments,
    totalVerifiedYears,
    averageReferenceRating,
    referenceCount,
    uniqueEmployersWithReferences,
    fraudFlagsCount,
  };
}

/**
 * Calculate the core trust score for a user and persist to trust_scores.
 * One stored score per user (portable core score). Recalculation triggers:
 * match confirmation, reference submission, fraud flag add/remove, dispute resolution.
 */
export async function calculateCoreTrustScore(userId: string): Promise<{
  score: number;
  components: TrustScoreComponents;
}> {
  const components = await getTrustScoreComponents(userId);
  const score = computeWeightedTrustScore(components, coreWeights);

  const sb = getSupabaseServer();
  const { error } = await sb.from("trust_scores").upsert(
    {
      user_id: userId,
      score,
      job_count: components.verifiedEmployments,
      reference_count: components.referenceCount,
      average_rating: components.averageReferenceRating,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[trustScore] upsert error:", error);
  }

  return { score, components };
}

/**
 * Recalculate and persist core trust score; log to audit_logs.
 * Call after: match confirmation, reference submission, fraud flag change, dispute resolution.
 */
export async function recalculateTrustScore(userId: string): Promise<{ score: number }> {
  const { score, components } = await calculateCoreTrustScore(userId);

  const sb = getSupabaseServer();
  await sb.from("audit_logs").insert({
    entity_type: "trust_score",
    entity_id: userId,
    changed_by: userId,
    new_value: {
      score,
      verified_employments: components.verifiedEmployments,
      reference_count: components.referenceCount,
    },
    change_reason: "trust_score_recalculation",
  });

  return { score };
}
