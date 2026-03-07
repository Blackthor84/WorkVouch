/**
 * Get trust score and verification count from trust_events.
 * Base 50, +5 coworker_verified, +10 manager_verified, -10 employment_disputed.
 * Clamp 0–100.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const BASE_SCORE = 50;
const COWORKER_POINTS = 5;
const MANAGER_POINTS = 10;
const DISPUTE_PENALTY = 10;
const MIN_SCORE = 0;
const MAX_SCORE = 100;

export type GetTrustScoreResult = {
  trustScore: number;
  verificationCount: number;
};

/**
 * Calculate trust score and total verification count for a profile.
 */
export async function getTrustScore(
  profileId: string
): Promise<GetTrustScoreResult> {
  const sb = getSupabaseServer();
  const { data: rows, error } = await sb
    .from("trust_events")
    .select("event_type")
    .eq("profile_id", profileId);

  if (error) {
    return { trustScore: BASE_SCORE, verificationCount: 0 };
  }

  const list = (rows ?? []) as unknown as { event_type: string }[];
  let score = BASE_SCORE;
  let verificationCount = 0;

  for (const r of list) {
    switch (r.event_type) {
      case "coworker_verified":
      case "coworker_verification_confirmed":
        score += COWORKER_POINTS;
        verificationCount += 1;
        break;
      case "manager_verified":
      case "employment_verified":
      case "verification_confirmed":
        score += MANAGER_POINTS;
        verificationCount += 1;
        break;
      case "employment_disputed":
        score -= DISPUTE_PENALTY;
        break;
      default:
        break;
    }
  }

  const trustScore = Math.max(
    MIN_SCORE,
    Math.min(MAX_SCORE, Math.round(score))
  );

  return { trustScore, verificationCount };
}
