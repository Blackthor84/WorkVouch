/**
 * Enterprise team fit engine. Server-side only.
 * Accepts candidateId and employerId; computes team baseline from verified employees; alignment score.
 * Persists to team_fit_scores. Never exposes to employees. Fail gracefully; neutral if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getIndustryBaseline } from "@/lib/intelligence/baselines";
import { resolveIndustryKey } from "@/lib/industry-normalization";
import { getHybridBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import { getBehavioralVector } from "@/lib/intelligence/getBehavioralVector";

const MODEL_VERSION = "1";
const NEUTRAL_ALIGNMENT = 50;

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[team-fit-engine:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

async function getTeamBaseline(
  supabase: ReturnType<typeof getSupabaseServer>,
  employerId: string
): Promise<{
  avgTenureMonths: number;
  avgVerifiedCount: number;
  avgReferenceCount: number;
  industryKey: string;
  sampleSize: number;
}> {
  try {
    const { data: employer } = await supabase
      .from("employer_accounts")
      .select("industry_type, industry_key")
      .eq("id", employerId)
      .maybeSingle();
    const industryKey = resolveIndustryKey(
      (employer as { industry_key?: string } | null)?.industry_key,
      (employer as { industry_type?: string } | null)?.industry_type
    );
    const baseline = await getIndustryBaseline(industryKey);

    const { data: records } = await supabase
      .from("employment_records")
      .select("user_id, start_date, end_date")
      .eq("marked_by_employer_id", employerId)
      .in("verification_status", ["verified", "matched"]);
    const recs = (records ?? []) as { user_id: string; start_date?: string; end_date?: string | null }[];
    const uniqueUsers = [...new Set(recs.map((r) => r.user_id))];
    let totalTenureMonths = 0;
    for (const r of recs) {
      const s = r.start_date ? new Date(r.start_date).getTime() : 0;
      const e = r.end_date ? new Date(r.end_date).getTime() : Date.now();
      if (s > 0 && e >= s) totalTenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const avgTenureMonths = recs.length > 0 ? totalTenureMonths / recs.length : baseline.avg_tenure_months ?? 24;
    const avgVerifiedCount = uniqueUsers.length > 0 ? recs.length / uniqueUsers.length : 1;

    let totalRefs = 0;
    if (uniqueUsers.length > 0) {
      const { count } = await supabase
        .from("employment_references")
        .select("*", { count: "exact", head: true })
        .in("reviewed_user_id", uniqueUsers);
      totalRefs = count ?? 0;
    }
    const avgReferenceCount = uniqueUsers.length > 0 ? totalRefs / uniqueUsers.length : 0;

    return {
      avgTenureMonths,
      avgVerifiedCount,
      avgReferenceCount,
      industryKey,
      sampleSize: uniqueUsers.length,
    };
  } catch (e) {
    safeLog("getTeamBaseline", e);
    const baseline = await getIndustryBaseline("corporate");
    return {
      avgTenureMonths: baseline.avg_tenure_months ?? 24,
      avgVerifiedCount: 1,
      avgReferenceCount: 0,
      industryKey: "corporate",
      sampleSize: 0,
    };
  }
}

async function getCandidateMetrics(
  supabase: ReturnType<typeof getSupabaseServer>,
  candidateId: string
): Promise<{ tenureMonths: number; verifiedCount: number; referenceCount: number }> {
  try {
    const { data: records } = await supabase
      .from("employment_records")
      .select("id, start_date, end_date")
      .eq("user_id", candidateId)
      .in("verification_status", ["verified", "matched"]);
    const recs = (records ?? []) as { id: string; start_date?: string; end_date?: string | null }[];
    let tenureMonths = 0;
    for (const r of recs) {
      const s = r.start_date ? new Date(r.start_date).getTime() : 0;
      const e = r.end_date ? new Date(r.end_date).getTime() : Date.now();
      if (s > 0 && e >= s) tenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const { count: refCount } = await supabase
      .from("employment_references")
      .select("*", { count: "exact", head: true })
      .eq("reviewed_user_id", candidateId);
    return {
      tenureMonths,
      verifiedCount: recs.length,
      referenceCount: refCount ?? 0,
    };
  } catch (e) {
    safeLog("getCandidateMetrics", e);
    return { tenureMonths: 0, verifiedCount: 0, referenceCount: 0 };
  }
}

/** Weighted absolute difference between candidate vector and baseline; 0 = perfect match, higher = worse. */
function behavioralDistance(
  candidate: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; conflict_risk_level: number; tone_stability: number },
  baseline: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; avg_conflict_risk: number; avg_tone_stability: number }
): number {
  const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative"] as const;
  let sum = 0;
  for (const k of keys) sum += Math.abs((candidate[k] ?? 50) - (baseline[k] ?? 50));
  sum += Math.abs((candidate.conflict_risk_level ?? 50) - (baseline.avg_conflict_risk ?? 50));
  sum += Math.abs((candidate.tone_stability ?? 50) - (baseline.avg_tone_stability ?? 50));
  return sum / 8;
}

/** Convert distance (0–100 scale, 0 = perfect) to alignment score 0–100. */
function distanceToAlignmentScore(distance: number): number {
  return clamp(100 - Math.min(100, distance));
}

export type SimulationContext = { simulationSessionId: string; expiresAt: string } | null | undefined;

export async function computeAndPersistTeamFit(
  candidateId: string,
  employerId: string,
  simulationContext?: SimulationContext
): Promise<{ alignmentScore: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer();
    const [baseline, candidate, profileRow, candidateVector] = await Promise.all([
      getTeamBaseline(supabase, employerId),
      getCandidateMetrics(supabase, candidateId),
      supabase.from("profiles").select("industry, industry_key").eq("id", candidateId).maybeSingle(),
      getBehavioralVector(candidateId),
    ]);

    let alignment = NEUTRAL_ALIGNMENT;
    const tenureRatio = baseline.avgTenureMonths > 0
      ? Math.min(1.5, candidate.tenureMonths / baseline.avgTenureMonths)
      : 1;
    const verifiedRatio = baseline.avgVerifiedCount > 0
      ? Math.min(1.5, candidate.verifiedCount / baseline.avgVerifiedCount)
      : 1;
    const refRatio = baseline.avgReferenceCount > 0
      ? Math.min(1.5, candidate.referenceCount / baseline.avgReferenceCount)
      : candidate.referenceCount > 0 ? 1 : 0.5;
    const tenureComponent = clamp(
      NEUTRAL_ALIGNMENT +
        (tenureRatio - 1) * 15 +
        (verifiedRatio - 1) * 15 +
        (refRatio - 0.5) * 20
    );

    let behavioral_alignment_score = NEUTRAL_ALIGNMENT;
    if (candidateVector) {
      const candidateIndustry = resolveIndustryKey(
        (profileRow?.data as { industry_key?: string } | null)?.industry_key,
        (profileRow?.data as { industry?: string } | null)?.industry
      );
      const hybridBaseline = await getHybridBehavioralBaseline(candidateIndustry, employerId);
      const distance = behavioralDistance(candidateVector, hybridBaseline);
      behavioral_alignment_score = distanceToAlignmentScore(distance);
    }
    alignment = clamp(tenureComponent * 0.75 + behavioral_alignment_score * 0.25);

    const breakdown = {
      teamAvgTenureMonths: baseline.avgTenureMonths,
      teamAvgVerifiedCount: baseline.avgVerifiedCount,
      teamAvgReferenceCount: baseline.avgReferenceCount,
      teamSampleSize: baseline.sampleSize,
      candidateTenureMonths: candidate.tenureMonths,
      candidateVerifiedCount: candidate.verifiedCount,
      candidateReferenceCount: candidate.referenceCount,
      tenureRatio,
      verifiedRatio,
      refRatio,
      behavioral_alignment_score: behavioral_alignment_score,
    };

    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      candidate_id: candidateId,
      employer_id: employerId,
      model_version: MODEL_VERSION,
      alignment_score: alignment,
      breakdown: { ...breakdown } as unknown as Record<string, unknown>,
      updated_at: now,
    };
    if (simulationContext) {
      row.is_simulation = true;
      row.simulation_session_id = simulationContext.simulationSessionId;
      row.expires_at = simulationContext.expiresAt;
    }
    const { data: existing } = await supabase
      .from("team_fit_scores")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("team_fit_scores").update(row).eq("id", (existing as { id: string }).id);
    } else {
      const insertRow: Record<string, unknown> = {
        candidate_id: candidateId,
        employer_id: employerId,
        model_version: MODEL_VERSION,
        alignment_score: alignment,
        breakdown: { ...breakdown } as unknown as Record<string, unknown>,
      };
      if (simulationContext) {
        insertRow.is_simulation = true;
        insertRow.simulation_session_id = simulationContext.simulationSessionId;
        insertRow.expires_at = simulationContext.expiresAt;
      }
      await supabase.from("team_fit_scores").insert(insertRow);
    }
    return { alignmentScore: alignment, breakdown };
  } catch (e) {
    safeLog("computeAndPersistTeamFit", e);
    return null;
  }
}
