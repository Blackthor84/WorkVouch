/**
 * Trust Forecasting — derives from trust_events only.
 * Uses SQL forecast_trust_trajectory when available; else computes in TS.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type ForecastTrajectory = "improving" | "stable" | "at_risk";

export type TrustForecastResult = {
  trajectory: ForecastTrajectory;
  confidence: number;
  recentImpact: number;
  previousImpact: number;
  recentEventCount: number;
};

const STABLE_THRESHOLD = 5;
const CONFIDENCE_EVENT_CAP = 10;

/**
 * Resolve has_unresolved_dispute from compliance_disputes (not from trust_events).
 */
async function hasUnresolvedDispute(profileId: string): Promise<boolean> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from("compliance_disputes")
    .select("id")
    .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`)
    .in("status", ["Pending", "UnderReview", "AwaitingEmployerResponse"])
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Call SQL function forecast_trust_trajectory or compute in TS from trust_events.
 */
export async function getTrustForecast(profileId: string): Promise<TrustForecastResult> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
  const hasDispute = await hasUnresolvedDispute(profileId);

  try {
    const { data: rpcRows, error: rpcError } = await sb.rpc("forecast_trust_trajectory", {
      p_profile_id: profileId,
      p_has_unresolved_dispute: hasDispute,
    });

    if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
      const row = rpcRows[0] as {
        trajectory?: string;
        recent_impact?: number;
        previous_impact?: number;
        recent_event_count?: number;
      };
      const trajectory = (row.trajectory === "improving" || row.trajectory === "stable" || row.trajectory === "at_risk"
        ? row.trajectory
        : "stable") as ForecastTrajectory;
      const recentImpact = Number(row.recent_impact ?? 0);
      const previousImpact = Number(row.previous_impact ?? 0);
      const recentEventCount = Number(row.recent_event_count ?? 0);
      const confidence = Math.min(1, recentEventCount / CONFIDENCE_EVENT_CAP);
      return {
        trajectory,
        confidence,
        recentImpact,
        previousImpact,
        recentEventCount,
      };
    }
  } catch {
    // fallback to TS computation
  }

  return computeForecastInTs(sb, profileId, hasDispute);
}

/**
 * Compute forecast in TypeScript from trust_events (no RPC).
 */
async function computeForecastInTs(
  sb: ReturnType<typeof getSupabaseServer>,
  profileId: string,
  hasDispute: boolean
): Promise<TrustForecastResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  const { data: rows, error } = await sb
    .from("trust_events")
    .select("impact_score, created_at")
    .eq("profile_id", profileId)
    .gte("created_at", sixtyDaysAgo.toISOString());

  if (error) {
    return {
      trajectory: "stable",
      confidence: 0,
      recentImpact: 0,
      previousImpact: 0,
      recentEventCount: 0,
    };
  }

  const list = (rows ?? []) as unknown as { impact_score?: number; created_at: string }[];
  let recentImpact = 0;
  let previousImpact = 0;
  let recentEventCount = 0;

  for (const e of list) {
    const created = new Date(e.created_at).getTime();
    const score = Number(e.impact_score ?? 0);
    if (created >= thirtyDaysAgo.getTime()) {
      recentImpact += score;
      recentEventCount += 1;
    } else if (created >= sixtyDaysAgo.getTime()) {
      previousImpact += score;
    }
  }

  let trajectory: ForecastTrajectory = "stable";
  if (hasDispute) {
    trajectory = "at_risk";
  } else if (recentImpact > previousImpact) {
    trajectory = "improving";
  } else if (Math.abs(recentImpact - previousImpact) >= STABLE_THRESHOLD) {
    trajectory = "at_risk";
  }

  const confidence = Math.min(1, recentEventCount / CONFIDENCE_EVENT_CAP);

  return {
    trajectory,
    confidence,
    recentImpact,
    previousImpact,
    recentEventCount,
  };
}
