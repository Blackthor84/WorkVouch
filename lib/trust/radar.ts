/**
 * Trust Radar: compute 6 dimensions (0–100) from real data.
 * Used by GET /api/trust/radar/[profileId].
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RadarDimensions = {
  verificationCoverage: number;
  referenceCredibility: number;
  networkDepth: number;
  disputeScore: number;
  consistencyScore: number;
  recencyScore: number;
};

/** Normalize value to 0–100 (cap at 100). */
function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round(Math.min(100, (value / max) * 100));
}

/**
 * verificationCoverage: % of employment_records with verification_status = 'verified'
 */
async function getVerificationCoverage(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("employment_records")
    .select("verification_status")
    .eq("user_id", profileId);
  const list = (data ?? []) as { verification_status?: string }[];
  if (list.length === 0) return 0;
  const verified = list.filter((r) => r.verification_status === "verified").length;
  return toPercent(verified, list.length);
}

/**
 * referenceCredibility: from user_references + employment_references (count and quality).
 * Score: refs received; cap at 100 with a soft max (e.g. 5 refs = 100).
 */
async function getReferenceCredibility(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const [ur, er] = await Promise.all([
    supabase
      .from("user_references")
      .select("id, rating")
      .eq("to_user_id", profileId)
      .eq("is_deleted", false),
    supabase
      .from("employment_references")
      .select("id, rating")
      .eq("reviewed_user_id", profileId),
  ]);
  const urList = (ur.data ?? []) as { id: string; rating?: number }[];
  const erList = (er.data ?? []) as { id: string; rating?: number }[];
  const total = urList.length + erList.length;
  if (total === 0) return 0;
  const avgRating =
    [...urList, ...erList].reduce((s, r) => s + (typeof r.rating === "number" ? r.rating : 3), 0) /
    total;
  const countScore = Math.min(100, total * 20);
  const qualityScore = avgRating <= 0 ? 0 : toPercent(avgRating, 5);
  return Math.round((countScore * 0.5 + qualityScore * 0.5));
}

/**
 * networkDepth: from trust_relationships. Score from connection count (e.g. 10+ = 100).
 */
async function getNetworkDepth(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("trust_relationships")
    .select("id")
    .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);
  const count = (data ?? []).length;
  return toPercent(count, 10);
}

/**
 * disputeScore: inverse of unresolved disputes. 0 open = 100; each open reduces.
 */
async function getDisputeScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("compliance_disputes")
    .select("id, status")
    .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`);
  const list = (data ?? []) as { id: string; status: string }[];
  const resolved = list.filter(
    (r) =>
      String(r.status).toLowerCase() === "resolved" || String(r.status).toLowerCase() === "rejected"
  ).length;
  const open = list.length - resolved;
  if (list.length === 0) return 100;
  if (open === 0) return 100;
  return Math.max(0, 100 - open * 25);
}

/**
 * consistencyScore: employment overlap / date consistency (no large gaps or conflicts).
 * Simplified: no overlapping dates with same employer = good; gaps reduce score.
 */
async function getConsistencyScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("employment_records")
    .select("id, start_date, end_date, company_name")
    .eq("user_id", profileId)
    .order("start_date", { ascending: true });
  const records = (data ?? []) as {
    id: string;
    start_date: string;
    end_date: string | null;
    company_name: string;
  }[];
  if (records.length <= 1) return 100;
  let penalties = 0;
  const now = new Date();
  for (let i = 0; i < records.length; i++) {
    const curr = records[i];
    const start = new Date(curr.start_date);
    const end = curr.end_date ? new Date(curr.end_date) : now;
    for (let j = i + 1; j < records.length; j++) {
      const other = records[j];
      const oStart = new Date(other.start_date);
      const oEnd = other.end_date ? new Date(other.end_date) : now;
      if (curr.company_name === other.company_name && start < oEnd && end > oStart) {
        penalties += 20;
      }
    }
    if (i > 0) {
      const prev = records[i - 1];
      const prevEnd = prev.end_date ? new Date(prev.end_date) : now;
      const gapMonths = (start.getTime() - prevEnd.getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (gapMonths > 24) penalties += 15;
    }
  }
  return Math.max(0, 100 - penalties);
}

/**
 * recencyScore: from trust_events (event engine). Uses impact_score when present, else impact.
 */
async function getRecencyScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const { data } = await supabase
    .from("trust_events")
    .select("created_at, impact, impact_score")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);
  const list = (data ?? []) as { created_at: string; impact?: string; impact_score?: number }[];
  if (list.length === 0) return 50;
  const now = Date.now();
  let weighted = 0;
  let totalWeight = 0;
  for (const e of list) {
    const ageDays = (now - new Date(e.created_at).getTime()) / (24 * 60 * 60 * 1000);
    const weight = Math.max(0, 1 - ageDays / 365);
    totalWeight += weight;
    const impactScore =
      typeof e.impact_score === "number"
        ? Math.max(0, Math.min(1, (e.impact_score + 10) / 20))
        : e.impact === "positive"
          ? 1
          : e.impact === "negative"
            ? 0.3
            : 0.7;
    weighted += weight * impactScore;
  }
  if (totalWeight <= 0) return 50;
  return toPercent(weighted / totalWeight, 1);
}

export async function getTrustRadarDimensions(
  supabase: SupabaseClient,
  profileId: string
): Promise<RadarDimensions> {
  const [
    verificationCoverage,
    referenceCredibility,
    networkDepth,
    disputeScore,
    consistencyScore,
    recencyScore,
  ] = await Promise.all([
    getVerificationCoverage(supabase, profileId),
    getReferenceCredibility(supabase, profileId),
    getNetworkDepth(supabase, profileId),
    getDisputeScore(supabase, profileId),
    getConsistencyScore(supabase, profileId),
    getRecencyScore(supabase, profileId),
  ]);

  return {
    verificationCoverage,
    referenceCredibility,
    networkDepth,
    disputeScore,
    consistencyScore,
    recencyScore,
  };
}
