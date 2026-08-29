/**
 * Trust Policy evaluation engine.
 * Evaluates a candidate against an employer-defined trust policy using stored
 * trust signals only (no recomputation from trust_events). Results are cached.
 */

import type { DepthBand } from "./depthBands";
import { toDepthBand } from "./depthBands";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeVerificationCoverage,
  loadCandidateEmploymentRows,
} from "@/lib/employer/candidateEmploymentSource";
import {
  candidateHasReferenceType,
  hasRecentTrustDispute,
  loadStoredTrustScore,
  loadTrustRelationships,
} from "@/lib/trust/productionSafeQueries";

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

/** Clear evaluation cache (for tests and policy updates). */
export function clearTrustPolicyCache(): void {
  cache.clear();
}

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

  // 1) Trust score (stored, production-safe when trust_scores absent)
  const candidateTrustScore = await loadStoredTrustScore(supabase, candidateId);
  if (candidateTrustScore >= pol.min_trust_score) {
    matched.push("trust_score");
  } else {
    failed.push("trust_score");
  }

  // 2) Verification coverage (employment_records → jobs fallback)
  const employmentRows = await loadCandidateEmploymentRows(
    candidateId,
    supabase as unknown as import("@/lib/employer/candidateEmploymentSource").EmploymentClient
  );
  const { coveragePercent } = computeVerificationCoverage(employmentRows);
  if (coveragePercent >= pol.min_verification_coverage) {
    matched.push("verification_coverage");
  } else {
    failed.push("verification_coverage");
  }

  // 3) Reference type (user_references → employment_references fallback)
  const requiredRef = (pol.required_reference_type ?? "").trim().toLowerCase();
  if (!requiredRef) {
    matched.push("reference_type");
  } else {
    const dbType = REFERENCE_TYPE_MAP[requiredRef] ?? requiredRef;
    const hasRef = await candidateHasReferenceType(supabase, candidateId, dbType);
    if (hasRef) {
      matched.push("reference_type");
    } else {
      failed.push("reference_type");
    }
  }

  // 4) Trust graph depth (from trust_relationships, band via depthBands)
  const minDepth = (pol.min_trust_graph_depth ?? "").trim().toLowerCase() || "weak";
  const depthOrder = DEPTH_ORDER[minDepth] ?? 1;
  const relList = await loadTrustRelationships(supabase, candidateId);
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
    const hasRecentDispute = await hasRecentTrustDispute(
      supabase,
      candidateId,
      since.toISOString()
    );
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
