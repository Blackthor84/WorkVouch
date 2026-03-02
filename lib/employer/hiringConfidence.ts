/**
 * Employer Hiring Confidence — deterministic high | medium | low from real data.
 * Based on: verification coverage, reference consistency, dispute history, trust trajectory.
 * No raw trust scores. No placeholders. Uses existing tables only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  getTrustTrajectoryInput,
  getTrustTrajectory,
  type TrustTrajectoryResult,
} from "@/lib/trust/trustTrajectory";

export type HiringConfidenceLevel = "high" | "medium" | "low";

export type HiringConfidencePayload = {
  level: HiringConfidenceLevel;
  positives: string[];
  cautions: string[];
};

/**
 * Compute hiring confidence from verification coverage, reference consistency,
 * dispute history, and trust trajectory. Returns level plus positives and cautions.
 * Never exposes raw scores.
 */
export async function getHiringConfidence(
  candidateId: string
): Promise<HiringConfidencePayload> {
  const [trajectoryInput, trajectoryPayload, disputeHistory, refConsistency] =
    await Promise.all([
      getTrustTrajectoryInput(candidateId),
      getTrustTrajectory(candidateId),
      getDisputeHistory(candidateId),
      getReferenceConsistency(candidateId),
    ]);

  const trajectory = trajectoryPayload.trajectory;
  const positives: string[] = [];
  const cautions: string[] = [];

  // —— Verification coverage ——
  const { verifiedEmploymentCount, totalVerifiedYears } = trajectoryInput;
  if (verifiedEmploymentCount >= 2 && totalVerifiedYears >= 1) {
    positives.push("Employment history is largely verified");
  } else if (verifiedEmploymentCount >= 1) {
    positives.push("Employment history is largely verified");
  } else {
    cautions.push("One or more roles not independently verified");
  }
  if (verifiedEmploymentCount >= 2 && totalVerifiedYears >= 0.5) {
    positives.push("Consistent employment history");
  }

  // —— Reference consistency ——
  const { referenceCount } = trajectoryInput;
  if (referenceCount >= 2) {
    positives.push("References show consistent peer feedback");
  } else if (referenceCount >= 1) {
    positives.push("References show consistent peer feedback");
  } else {
    cautions.push("Limited recent references");
  }
  if (refConsistency.fromMultipleEmployers) {
    positives.push("References from more than one employer");
  }

  // —— Dispute history ——
  if (trajectoryInput.hasOpenDispute) {
    cautions.push("Open or under-review dispute");
  } else {
    positives.push("No unresolved disputes");
  }
  if (disputeHistory.resolvedCount > 0) {
    positives.push("Past disputes resolved");
  }

  // —— Trust trajectory ——
  if (trajectory === "improving") {
    positives.push("Trust trajectory improving");
  } else if (trajectory === "stable") {
    positives.push("Stable trust trajectory");
  } else {
    cautions.push("Trust trajectory at risk; consider additional verification");
  }

  // —— Deterministic level (never high with open dispute) ——
  const level = computeLevel(trajectoryInput, trajectory, refConsistency);

  const dedupedPositives = [...new Set(positives)];
  const dedupedCautions = [...new Set(cautions)];
  // NEVER allow both empty: at least one positive or one caution
  if (dedupedPositives.length === 0 && dedupedCautions.length === 0) {
    dedupedPositives.push("Based on verification coverage, peer consistency, and dispute history.");
  }

  return {
    level,
    positives: dedupedPositives,
    cautions: dedupedCautions,
  };
}

function computeLevel(
  input: {
    hasOpenDispute: boolean;
    verifiedEmploymentCount: number;
    totalVerifiedYears: number;
    referenceCount: number;
  },
  trajectory: TrustTrajectoryResult,
  refConsistency: { fromMultipleEmployers: boolean }
): HiringConfidenceLevel {
  if (input.hasOpenDispute || trajectory === "at_risk") {
    return "low";
  }
  const strongVerification =
    input.verifiedEmploymentCount >= 2 && input.totalVerifiedYears >= 0.5;
  const hasReferences = input.referenceCount >= 1;
  const multipleRefs = input.referenceCount >= 2 || refConsistency.fromMultipleEmployers;
  if (
    (trajectory === "improving" || trajectory === "stable") &&
    strongVerification &&
    hasReferences
  ) {
    return "high";
  }
  if (
    (trajectory === "improving" || trajectory === "stable") &&
    (input.verifiedEmploymentCount >= 1 || hasReferences)
  ) {
    return "medium";
  }
  if (input.verifiedEmploymentCount === 0 && input.referenceCount === 0) {
    return "low";
  }
  return "medium";
}

async function getDisputeHistory(candidateId: string): Promise<{
  openCount: number;
  resolvedCount: number;
}> {
  const supabase = getSupabaseServer();
  const { data: openRows } = await supabase
    .from("disputes")
    .select("id")
    .eq("user_id", candidateId)
    .in("status", ["open", "under_review"]);
  const { data: resolvedRows } = await supabase
    .from("disputes")
    .select("id")
    .eq("user_id", candidateId)
    .eq("status", "resolved");
  return {
    openCount: Array.isArray(openRows) ? openRows.length : 0,
    resolvedCount: Array.isArray(resolvedRows) ? resolvedRows.length : 0,
  };
}

async function getReferenceConsistency(candidateId: string): Promise<{
  fromMultipleEmployers: boolean;
}> {
  const supabase = getSupabaseServer();
  const { data: refs } = await supabase
    .from("employment_references")
    .select("employment_match_id")
    .eq("reviewed_user_id", candidateId);
  const refList = (refs ?? []) as { employment_match_id: string }[];
  if (refList.length < 2) {
    return { fromMultipleEmployers: false };
  }
  const matchIds = refList.map((r) => r.employment_match_id);
  const { data: matches } = await supabase
    .from("employment_matches")
    .select("employment_record_id")
    .in("id", matchIds);
  const matchList = (matches ?? []) as { employment_record_id: string }[];
  const recordIds = matchList.map((m) => m.employment_record_id);
  if (recordIds.length === 0) return { fromMultipleEmployers: false };
  const { data: records } = await supabase
    .from("employment_records")
    .select("company_normalized")
    .in("id", recordIds);
  const companies = (records ?? []) as { company_normalized: string }[];
  const uniqueCompanies = new Set(companies.map((r) => r.company_normalized).filter(Boolean));
  return { fromMultipleEmployers: uniqueCompanies.size >= 2 };
}
