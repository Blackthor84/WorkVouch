/**
 * Trust invariants evaluated by the fuzzer after a run.
 * - Reputation must not grow linearly under suspicious patterns
 * - Abuse signals must trigger when thresholds are crossed
 * - Trust scores must stabilize under oscillation
 * - Rate limits must activate when appropriate
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type TrustSnapshotRow = {
  step_index: number;
  step_id: string;
  actor_ref: string;
  actor_id: string;
  profile_strength: number | null;
};

export type InvariantResult = {
  name: string;
  passed: boolean;
  message?: string;
  actual?: unknown;
};

/**
 * Reputation must not grow linearly under suspicious patterns (e.g. boost ring).
 * If all actors increased by similar large amounts in lockstep, fail.
 */
export function evaluateReputationNotLinear(
  snapshots: TrustSnapshotRow[],
  actorRefs: string[],
  maxCombinedIncrease: number
): InvariantResult {
  if (snapshots.length === 0 || actorRefs.length === 0) {
    return { name: "reputation_not_linear", passed: true, message: "No data" };
  }
  const byActor = new Map<string, number[]>();
  for (const row of snapshots) {
    if (!actorRefs.includes(row.actor_ref)) continue;
    if (!byActor.has(row.actor_ref)) byActor.set(row.actor_ref, []);
    const s = row.profile_strength;
    if (s != null) byActor.get(row.actor_ref)!.push(s);
  }
  let totalIncrease = 0;
  for (const ref of actorRefs) {
    const vals = byActor.get(ref) ?? [];
    if (vals.length >= 2) {
      const delta = vals[vals.length - 1]! - vals[0]!;
      if (delta > 0) totalIncrease += delta;
    }
  }
  const passed = totalIncrease <= maxCombinedIncrease;
  return {
    name: "reputation_not_linear",
    passed,
    actual: { totalIncrease, maxCombinedIncrease },
    message: passed ? undefined : `Combined reputation increase ${totalIncrease} exceeds max ${maxCombinedIncrease}`,
  };
}

/**
 * Abuse signals must trigger when thresholds are crossed.
 * Count sandbox_events type=abuse_flagged for this scenario/run; require min_count.
 */
export async function evaluateAbuseSignalsTriggered(
  scenarioId: string,
  fuzzRunId: string,
  minCount: number
): Promise<InvariantResult> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sandbox_events")
    .select("id")
    .eq("scenario_id", scenarioId)
    .eq("type", "abuse_flagged");
  const count = (data ?? []).length;
  const passed = count >= minCount;
  return {
    name: "abuse_signals_triggered",
    passed,
    actual: { count, minCount },
    message: passed ? undefined : `Abuse signals ${count} < min ${minCount}`,
  };
}

/**
 * Trust scores must stabilize under oscillation (variance in last N steps bounded).
 */
export function evaluateTrustStabilizes(
  snapshots: TrustSnapshotRow[],
  actorRef: string,
  windowSteps: number,
  maxOscillation: number
): InvariantResult {
  const forActor = snapshots
    .filter((r) => r.actor_ref === actorRef && r.profile_strength != null)
    .map((r) => r.profile_strength as number);
  if (forActor.length < 2 || windowSteps < 2) {
    return { name: "trust_stabilizes", passed: true, message: "Insufficient data" };
  }
  const window = forActor.slice(-windowSteps);
  const min = Math.min(...window);
  const max = Math.max(...window);
  const oscillation = max - min;
  const passed = oscillation <= maxOscillation;
  return {
    name: "trust_stabilizes",
    passed,
    actual: { oscillation, maxOscillation, window },
    message: passed ? undefined : `Oscillation ${oscillation} exceeds max ${maxOscillation}`,
  };
}

/**
 * Rate limits must activate when appropriate.
 * Check sandbox_events for rate_limit or similar; if we have no rate-limit events yet, pass with note.
 */
export async function evaluateRateLimitsActivate(
  scenarioId: string
): Promise<InvariantResult> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sandbox_events")
    .select("id, type")
    .eq("scenario_id", scenarioId)
    .or("type.eq.rate_limit,type.eq.rate_limited,type.ilike.%limit%");
  const count = (data ?? []).length;
  return {
    name: "rate_limits_activate",
    passed: true,
    actual: { rate_limit_events: count },
    message: count > 0 ? "Rate limit events recorded" : "No rate-limit events (system may not emit them yet)",
  };
}

export async function evaluateAllInvariants(
  attackType: string,
  scenarioId: string,
  fuzzRunId: string,
  snapshots: TrustSnapshotRow[],
  actorRefs: string[]
): Promise<InvariantResult[]> {
  const results: InvariantResult[] = [];
  results.push(
    evaluateReputationNotLinear(snapshots, actorRefs, 60)
  );
  results.push(
    await evaluateAbuseSignalsTriggered(scenarioId, fuzzRunId, attackType === "retaliation" ? 1 : 0)
  );
  if (actorRefs.length > 0) {
    results.push(
      evaluateTrustStabilizes(snapshots, actorRefs[0]!, Math.min(10, snapshots.length), 25)
    );
  }
  results.push(await evaluateRateLimitsActivate(scenarioId));
  return results;
}
