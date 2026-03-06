/**
 * Trust Event Engine.
 * - Emit trust events (event_type, event_source, impact_score, metadata).
 * - calculate_trust_score(profile_id): sum impact_score from trust_events → score, band, trajectory.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { Json } from "@/types/supabase";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";

export type TrustEventSource =
  | "employment_verification"
  | "reference_creation"
  | "verification_request_accepted"
  | "dispute_resolution"
  | "credential_sharing"
  | string;

export type EmitTrustEventParams = {
  profile_id: string;
  event_type: string;
  event_source: TrustEventSource;
  impact_score: number;
  metadata?: Record<string, unknown>;
};

const supabase = () => getSupabaseServer() as ReturnType<typeof getSupabaseServer>;

/**
 * Emit a trust event. Call from employment verification, reference creation,
 * verification request accepted, dispute resolution, credential sharing.
 */
export async function emitTrustEvent(params: EmitTrustEventParams): Promise<void> {
  const { profile_id, event_type, event_source, impact_score, metadata } = params;
  const payload = metadata ?? {};
  await supabase()
    .from("trust_events")
    .insert({
      profile_id,
      event_type,
      event_source,
      impact_score: Number(impact_score),
      metadata: payload as unknown as Json,
      payload: payload as unknown as Json,
      impact: impact_score > 0 ? "positive" : impact_score < 0 ? "negative" : "neutral",
    });
}

export type TrustScoreBand = "low" | "medium" | "high";

export type CalculateTrustScoreResult = {
  score: number;
  band: TrustScoreBand;
  trajectory: "improving" | "stable" | "at_risk";
  trajectoryLabel: string;
};

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function scoreToBand(raw: number): TrustScoreBand {
  const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, raw));
  if (clamped < 34) return "low";
  if (clamped < 67) return "medium";
  return "high";
}

/**
 * Calculate trust score for a profile: sum impact_score from trust_events.
 * Normalize to 0–100 using a simple mapping (e.g. sum capped and scaled).
 * Returns score (0–100), band (low/medium/high), and trajectory from getTrustTrajectory.
 */
export async function calculateTrustScore(profileId: string): Promise<CalculateTrustScoreResult> {
  const sb = supabase();
  const { data: rows, error } = await sb
    .from("trust_events")
    .select("impact_score")
    .eq("profile_id", profileId);

  if (error) {
    console.error("[trust/eventEngine] calculateTrustScore", error);
    return {
      score: 0,
      band: "low",
      trajectory: "stable",
      trajectoryLabel: "Stable",
    };
  }

  const list = (rows ?? []) as { impact_score?: number | string }[];
  const rawSum = list.reduce((acc, r) => acc + Number(r.impact_score ?? 0), 0);

  // Map raw sum to 0–100: allow negative; clamp and scale. Simple: score = 50 + rawSum, clamped 0–100.
  const score = Math.round(
    Math.max(MIN_SCORE, Math.min(MAX_SCORE, 50 + rawSum))
  );
  const band = scoreToBand(score);

  let trajectory: CalculateTrustScoreResult["trajectory"] = "stable";
  let trajectoryLabel = "Stable";
  try {
    const traj = await getTrustTrajectory(profileId);
    trajectory = traj.trajectory;
    trajectoryLabel = traj.label;
  } catch {
    // keep defaults
  }

  return {
    score,
    band,
    trajectory,
    trajectoryLabel,
  };
}
