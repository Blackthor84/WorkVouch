import { admin } from "@/lib/supabase-admin";
import { calculateTrust } from "@/lib/trust/trustEngine";
import { getTrustTrajectoryInput } from "@/lib/trust/trustTrajectory";
import type { ConfidenceInput } from "./types";

/** Loads profile signals from existing tables for hiring confidence computation. */
export async function loadProfileConfidenceInput(profileId: string): Promise<ConfidenceInput> {
  const [trust, trajectoryInput, refs, disputes, freshness] = await Promise.all([
    calculateTrust(profileId).catch(() => null),
    getTrustTrajectoryInput(profileId).catch(() => null),
    loadReferenceCounts(profileId),
    loadDisputes(profileId),
    loadDataFreshness(profileId),
  ]);

  const missing: string[] = [];
  if (!trust || trust.score <= 0) missing.push("trust score");
  if ((trajectoryInput?.verifiedEmploymentCount ?? 0) === 0) missing.push("employment verification");
  if (refs.total === 0) missing.push("references");

  const referenceConsensus =
    refs.total >= 4 ? "strong" : refs.total >= 2 ? "moderate" : refs.total >= 1 ? "weak" : "unknown";

  return {
    profileId,
    trustScore: trust?.score ?? null,
    verifiedEmploymentCount: trajectoryInput?.verifiedEmploymentCount ?? trust?.verifiedEmploymentCount ?? 0,
    employmentVerified: (trajectoryInput?.verifiedEmploymentCount ?? 0) > 0,
    totalVerifiedYears: trajectoryInput?.totalVerifiedYears ?? 0,
    managerReferences: refs.manager,
    coworkerReferences: refs.coworker,
    referenceCompletionPct: refs.completionPct,
    referenceConsensus,
    averageReferenceRating: trust?.components.averageReferenceRating ?? 0,
    timelineConfidenceAvg: (trajectoryInput?.verifiedEmploymentCount ?? 0) >= 2 ? 0.9 : 0.5,
    workflowCompletionPct: estimateWorkflowCompletion(trajectoryInput, refs),
    dataFreshnessHours: freshness,
    fraudFlagsCount: trust?.components.fraudFlagsCount ?? 0,
    hasOpenDispute: disputes.open > 0 || (trajectoryInput?.hasOpenDispute ?? false),
    missingInformation: missing,
  };
}

function estimateWorkflowCompletion(
  trajectory: { verifiedEmploymentCount?: number; referenceCount?: number } | null,
  refs: { total: number; completionPct: number }
): number {
  let pct = 15;
  if ((trajectory?.verifiedEmploymentCount ?? 0) > 0) pct += 35;
  if (refs.total > 0) pct += 30;
  if (refs.completionPct >= 80) pct += 20;
  return Math.min(100, pct);
}

async function loadReferenceCounts(profileId: string) {
  const { data } = await admin
    .from("verification_requests")
    .select("relationship_type, status")
    .eq("requester_profile_id", profileId);

  const list = (data ?? []) as Array<{ relationship_type: string; status: string }>;
  const accepted = list.filter((r) => r.status === "accepted");
  const total = list.length;
  return {
    manager: accepted.filter((r) => r.relationship_type === "manager").length,
    coworker: accepted.filter(
      (r) => r.relationship_type === "coworker" || r.relationship_type === "peer"
    ).length,
    total: accepted.length,
    completionPct: total > 0 ? Math.round((accepted.length / total) * 100) : accepted.length > 0 ? 100 : 0,
  };
}

async function loadDisputes(profileId: string) {
  const { data } = await admin
    .from("disputes")
    .select("id")
    .eq("user_id", profileId)
    .in("status", ["open", "under_review"]);
  return { open: (data ?? []).length };
}

async function loadDataFreshness(profileId: string): Promise<number | null> {
  const { data } = await admin
    .from("trust_scores")
    .select("updated_at")
    .eq("user_id", profileId)
    .maybeSingle();

  const updated = (data as { updated_at?: string } | null)?.updated_at;
  if (!updated) return null;
  return (Date.now() - new Date(updated).getTime()) / 3_600_000;
}
