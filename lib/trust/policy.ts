/**
 * Trust Policy evaluation engine.
 * Evaluates a candidate against an employer-defined trust policy using stored
 * trust signals only (no recomputation from trust_events). Results are cached.
 */

import type { DepthBand } from "./depthBands";
import { toDepthBand } from "./depthBands";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TrustPolicyRow = {
  id: string;
  employer_id: string;
  policy_name: string;
  min_trust_score: number;
  min_verification_coverage: number;
  required_reference_type: string | null;
  min_trust_graph_depth: string | null;
  allow_recent_disputes: boolean;
  created_at: string;
};

/** Criterion key for match/fail lists */
export type PolicyCriterion =
  | "trust_score"
  | "verification_coverage"
  | "reference_type"
  | "trust_graph_depth"
  | "no_recent_disputes";

export type PolicyMatchResult = {
  matchScore: number;
  matchedCriteria: PolicyCriterion[];
  failedCriteria: PolicyCriterion[];
  policyId: string;
  policyName: string;
};

const DEPTH_ORDER: Record<string, number> = { weak: 1, moderate: 2, strong: 3 };
const DISPUTE_LOOKBACK_DAYS = 180;

/** Map policy required_reference_type to DB relationship_type */
const REFERENCE_TYPE_MAP: Record<string, string> = {
  manager: "supervisor",
  coworker: "coworker",
  client: "client",
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { result: PolicyMatchResult; expires: number }>();

function cacheKey(candidateId: string, policyId: string): string {
  return `${candidateId}:${policyId}`;
}

function getCached(candidateId: string, policyId: string): PolicyMatchResult | null {
  const key = cacheKey(candidateId, policyId);
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCached(candidateId: string, policyId: string, result: PolicyMatchResult): void {
  cache.set(cacheKey(candidateId, policyId), {
    result,
    expires: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Evaluate candidate against a single trust policy.
 * Uses stored trust_scores and aggregates; does not recompute from trust_events.
 */
export async function evaluateTrustPolicy(
  candidateId: string,
  policyId: string,
  supabase: SupabaseClient
): Promise<PolicyMatchResult> {
  const cached = getCached(candidateId, policyId);
  if (cached) return cached;

  const { data: policy, error: policyError } = await supabase
    .from("trust_policies")
    .select("*")
    .eq("id", policyId)
    .single();

  if (policyError || !policy) {
    return {
      matchScore: 0,
      matchedCriteria: [],
      failedCriteria: [
        "trust_score",
        "verification_coverage",
        "reference_type",
        "trust_graph_depth",
        "no_recent_disputes",
      ],
      policyId,
      policyName: "Unknown Policy",
    };
  }

  const pol = policy as TrustPolicyRow;
  const matched: PolicyCriterion[] = [];
  const failed: PolicyCriterion[] = [];

  // 1) Trust score (stored)
  const { data: scoreRow } = await supabase
    .from("trust_scores")
    .select("score")
    .eq("user_id", candidateId)
    .maybeSingle();
  const candidateTrustScore = scoreRow?.score != null ? Number(scoreRow.score) : 0;
  if (candidateTrustScore >= pol.min_trust_score) {
    matched.push("trust_score");
  } else {
    failed.push("trust_score");
  }

  // 2) Verification coverage (from employment_records, not recomputed each time)
  const { data: empRows } = await supabase
    .from("employment_records")
    .select("verification_status")
    .eq("user_id", candidateId);
  const list = (empRows ?? []) as { verification_status?: string }[];
  const totalRoles = list.length;
  const verifiedRoles = list.filter((r) => r.verification_status === "verified").length;
  const coveragePercent = totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;
  if (coveragePercent >= pol.min_verification_coverage) {
    matched.push("verification_coverage");
  } else {
    failed.push("verification_coverage");
  }

  // 3) Reference type (manager -> supervisor, coworker, client)
  const requiredRef = (pol.required_reference_type ?? "").trim().toLowerCase();
  if (!requiredRef) {
    matched.push("reference_type");
  } else {
    const dbType = REFERENCE_TYPE_MAP[requiredRef] ?? requiredRef;
    const { data: refRows } = await supabase
      .from("user_references")
      .select("id")
      .eq("to_user_id", candidateId)
      .eq("relationship_type", dbType)
      .eq("is_deleted", false)
      .limit(1);
    const hasRef = (refRows?.length ?? 0) > 0;
    if (hasRef) {
      matched.push("reference_type");
    } else {
      failed.push("reference_type");
    }
  }

  // 4) Trust graph depth (from trust_relationships, band via depthBands)
  const minDepth = (pol.min_trust_graph_depth ?? "").trim().toLowerCase() || "weak";
  const depthOrder = DEPTH_ORDER[minDepth] ?? 1;
  const { data: relRows } = await supabase
    .from("trust_relationships")
    .select("source_profile_id, target_profile_id, relationship_type")
    .or(`source_profile_id.eq.${candidateId},target_profile_id.eq.${candidateId}`);
  const relList = (relRows ?? []) as {
    source_profile_id: string;
    target_profile_id: string;
    relationship_type: string;
  }[];
  const directConnections = relList.filter((r) => r.source_profile_id === candidateId).length;
  const managerConfirmations = relList.filter(
    (r) => r.relationship_type === "manager_confirmation"
  ).length;
  const depthScore = directConnections + managerConfirmations * 2;
  const candidateBand: DepthBand = toDepthBand(depthScore);
  const candidateOrder = DEPTH_ORDER[candidateBand] ?? 1;
  if (candidateOrder >= depthOrder) {
    matched.push("trust_graph_depth");
  } else {
    failed.push("trust_graph_depth");
  }

  // 5) No recent disputes (trust_events event_type = 'dispute' in last 180 days)
  if (pol.allow_recent_disputes) {
    matched.push("no_recent_disputes");
  } else {
    const since = new Date();
    since.setDate(since.getDate() - DISPUTE_LOOKBACK_DAYS);
    const { data: disputeRows } = await supabase
      .from("trust_events")
      .select("id")
      .eq("profile_id", candidateId)
      .eq("event_type", "dispute")
      .gte("created_at", since.toISOString())
      .limit(1);
    const hasRecentDispute = (disputeRows?.length ?? 0) > 0;
    if (!hasRecentDispute) {
      matched.push("no_recent_disputes");
    } else {
      failed.push("no_recent_disputes");
    }
  }

  const total = matched.length + failed.length;
  const matchScore = total > 0 ? Math.round((matched.length / total) * 100) : 0;
  const result: PolicyMatchResult = {
    matchScore,
    matchedCriteria: matched,
    failedCriteria: failed,
    policyId: pol.id,
    policyName: pol.policy_name,
  };
  setCached(candidateId, policyId, result);
  return result;
}
