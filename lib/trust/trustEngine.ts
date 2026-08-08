/**
 * Canonical trust score model — persisted trust_scores + component breakdown.
 * Production recalculation uses lib/trustScore.calculateCoreTrustScore (v1 intelligence).
 * Display reads persisted rows; band/trajectory from trust_events engine.
 */

import { admin } from "@/lib/supabase-admin";
import { getTrustScoreComponents, type TrustScoreComponents } from "@/lib/trustScore";
import { calculateTrustScore as calculateFromEvents } from "@/lib/trust/eventEngine";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";
import {
  buildTrustExplanation,
  buildTrustBadges,
  type TrustExplanationLine,
  type TrustBadge,
} from "@/lib/trust/trustExplanation";

export type { TrustExplanationLine, TrustBadge };

export type TrustBand = "low" | "medium" | "high";

export type TrustTimelineEntry = {
  id: string;
  eventType: string;
  createdAt: string;
  impact: number | null;
  label: string;
};

export type TrustCalculationResult = {
  profileId: string;
  score: number;
  band: TrustBand;
  trajectory: "improving" | "stable" | "at_risk";
  trajectoryLabel: string;
  trajectoryFactors: string[];
  components: TrustScoreComponents;
  referenceCount: number;
  verifiedEmploymentCount: number;
  explanation: TrustExplanationLine[];
  badges: TrustBadge[];
};

function scoreToBand(score: number): TrustBand {
  if (score < 34) return "low";
  if (score < 67) return "medium";
  return "high";
}

export { buildTrustExplanation, buildTrustBadges };

/**
 * Canonical trust calculation for display.
 * Score: persisted trust_scores.score (0 if missing).
 * Band/trajectory: event engine + trajectory helper.
 */
export async function calculateTrust(profileId: string): Promise<TrustCalculationResult> {
  const { data: row } = await admin
    .from("trust_scores")
    .select("score, reference_count, job_count")
    .eq("user_id", profileId)
    .maybeSingle();

  const persisted = Math.max(
    0,
    Math.min(100, Number((row as { score?: number } | null)?.score ?? 0)),
  );

  const [components, eventResult, trajectory] = await Promise.all([
    getTrustScoreComponents(profileId),
    calculateFromEvents(profileId).catch(() => null),
    getTrustTrajectory(profileId).catch(() => null),
  ]);

  const score = persisted > 0 ? persisted : (eventResult?.score ?? 0);
  const band = eventResult?.band ?? scoreToBand(score);

  return {
    profileId,
    score,
    band,
    trajectory: trajectory?.trajectory ?? eventResult?.trajectory ?? "stable",
    trajectoryLabel: trajectory?.label ?? eventResult?.trajectoryLabel ?? "Stable",
    trajectoryFactors: trajectory?.tooltipFactors ?? [],
    components,
    referenceCount:
      Number((row as { reference_count?: number } | null)?.reference_count) ||
      components.referenceCount,
    verifiedEmploymentCount:
      Number((row as { job_count?: number } | null)?.job_count) ||
      components.verifiedEmployments,
    explanation: buildTrustExplanation(score, components),
    badges: buildTrustBadges(components),
  };
}

export async function loadTrustTimeline(
  profileId: string,
  limit = 20,
): Promise<TrustTimelineEntry[]> {
  const { data: rows } = await admin
    .from("trust_events")
    .select("id, event_type, created_at, impact_score")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((rows ?? []) as {
    id: string;
    event_type: string;
    created_at: string;
    impact_score?: number | null;
  }[]).map((r) => ({
    id: r.id,
    eventType: r.event_type,
    createdAt: r.created_at,
    impact: r.impact_score != null ? Number(r.impact_score) : null,
    label: r.event_type.replace(/_/g, " "),
  }));
}
