/**
 * Trust Radar: compute 6 dimensions (0–100) from real data.
 * Production-safe: falls back when tables/columns from later migrations are absent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeVerificationCoverage,
  loadCandidateEmploymentRows,
} from "@/lib/employer/candidateEmploymentSource";
import { loadCandidateReferenceRatings } from "@/lib/employer/candidateReferencesSource";
import {
  isMissingColumnError,
  isMissingTableError,
} from "@/lib/supabase/postgrestErrors";
import { loadTrustRelationships } from "@/lib/trust/productionSafeQueries";

export type RadarDimensions = {
  verificationCoverage: number;
  referenceCredibility: number;
  networkDepth: number;
  disputeScore: number;
  consistencyScore: number;
  recencyScore: number;
};

/** Safe all-zero response when optional radar inputs are unavailable. */
export const EMPTY_RADAR_DIMENSIONS: RadarDimensions = {
  verificationCoverage: 0,
  referenceCredibility: 0,
  networkDepth: 0,
  disputeScore: 0,
  consistencyScore: 0,
  recencyScore: 0,
};

function toPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round(Math.min(100, (value / max) * 100));
}

async function getVerificationCoverage(profileId: string): Promise<number> {
  const rows = await loadCandidateEmploymentRows(profileId);
  return computeVerificationCoverage(rows).coveragePercent;
}

async function getReferenceCredibility(profileId: string): Promise<number> {
  const refs = await loadCandidateReferenceRatings(profileId);
  const total = refs.length;
  if (total === 0) return 0;
  const avgRating =
    refs.reduce((s, r) => s + (typeof r.rating === "number" ? r.rating : 3), 0) / total;
  const countScore = Math.min(100, total * 20);
  const qualityScore = avgRating <= 0 ? 0 : toPercent(avgRating, 5);
  return Math.round(countScore * 0.5 + qualityScore * 0.5);
}

async function getNetworkDepth(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const rels = await loadTrustRelationships(supabase, profileId);
  return toPercent(rels.length, 10);
}

async function getDisputeScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const extended = await supabase
    .from("compliance_disputes")
    .select("id, status")
    .or(`profile_id.eq.${profileId},user_id.eq.${profileId}`);

  if (!extended.error) {
    const list = (extended.data ?? []) as { id: string; status: string }[];
    const resolved = list.filter(
      (r) =>
        String(r.status).toLowerCase() === "resolved" ||
        String(r.status).toLowerCase() === "rejected"
    ).length;
    const open = list.length - resolved;
    if (list.length === 0) return 100;
    if (open === 0) return 100;
    return Math.max(0, 100 - open * 25);
  }

  if (isMissingColumnError(extended.error)) {
    const userOnly = await supabase
      .from("compliance_disputes")
      .select("id, status")
      .eq("user_id", profileId);

    if (!userOnly.error) {
      const list = (userOnly.data ?? []) as { id: string; status: string }[];
      if (list.length === 0) return 100;
      const open = list.filter(
        (r) =>
          String(r.status).toLowerCase() !== "resolved" &&
          String(r.status).toLowerCase() !== "rejected"
      ).length;
      return open === 0 ? 100 : Math.max(0, 100 - open * 25);
    }

    if (isMissingTableError(userOnly.error)) return 100;
    throw new Error(userOnly.error.message ?? "Failed to load compliance disputes");
  }

  if (isMissingTableError(extended.error)) return 100;
  throw new Error(extended.error.message ?? "Failed to load compliance disputes");
}

async function getConsistencyScore(profileId: string): Promise<number> {
  const records = await loadCandidateEmploymentRows(profileId);
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

type TrustEventRecencyRow = {
  created_at: string;
  impact?: string;
  impact_score?: number;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  event_type?: string;
};

const TRUST_EVENT_RECENCY_SELECTS = [
  "created_at, impact, impact_score",
  "created_at, impact, metadata, event_type",
  "created_at, impact, metadata",
  "created_at, impact",
  "created_at, metadata, event_type",
  "created_at, metadata",
  "created_at",
] as const;

function impactScoreFromEvent(e: TrustEventRecencyRow): number {
  if (typeof e.impact_score === "number") {
    return Math.max(0, Math.min(1, (e.impact_score + 10) / 20));
  }
  if (e.impact === "positive") return 1;
  if (e.impact === "negative") return 0.3;
  const nestedImpact = String(
    e.payload?.impact ?? e.metadata?.impact ?? ""
  ).toLowerCase();
  if (nestedImpact === "positive") return 1;
  if (nestedImpact === "negative") return 0.3;
  const eventType = String(e.event_type ?? e.metadata?.event_type ?? "").toLowerCase();
  if (eventType.includes("dispute") || eventType.includes("flag")) return 0.3;
  return 0.7;
}

async function loadTrustEventsForRecency(
  supabase: SupabaseClient,
  profileId: string
): Promise<TrustEventRecencyRow[]> {
  for (const columns of TRUST_EVENT_RECENCY_SELECTS) {
    const result = await supabase
      .from("trust_events")
      .select(columns)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!result.error) {
      return (result.data ?? []) as TrustEventRecencyRow[];
    }
    if (isMissingTableError(result.error)) {
      return [];
    }
    if (isMissingColumnError(result.error)) {
      continue;
    }
    return [];
  }
  return [];
}

async function getRecencyScore(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const list = await loadTrustEventsForRecency(supabase, profileId);

  if (list.length === 0) return 50;
  const now = Date.now();
  let weighted = 0;
  let totalWeight = 0;
  for (const e of list) {
    const ageDays = (now - new Date(e.created_at).getTime()) / (24 * 60 * 60 * 1000);
    const weight = Math.max(0, 1 - ageDays / 365);
    totalWeight += weight;
    weighted += weight * impactScoreFromEvent(e);
  }
  if (totalWeight <= 0) return 50;
  return toPercent(weighted / totalWeight, 1);
}

async function safeDimension(
  compute: () => Promise<number>,
  fallback: number
): Promise<number> {
  try {
    return await compute();
  } catch {
    return fallback;
  }
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
    safeDimension(() => getVerificationCoverage(profileId), 0),
    safeDimension(() => getReferenceCredibility(profileId), 0),
    safeDimension(() => getNetworkDepth(supabase, profileId), 0),
    safeDimension(() => getDisputeScore(supabase, profileId), 100),
    safeDimension(() => getConsistencyScore(profileId), 100),
    safeDimension(() => getRecencyScore(supabase, profileId), 50),
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
