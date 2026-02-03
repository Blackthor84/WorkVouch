/**
 * Industry behavioral baseline engine. Service role only.
 * Aggregates behavioral_profile_vector by industry (profiles.industry normalized).
 * Min sample size required; no mock data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { resolveIndustryKey } from "@/lib/industry-normalization";

const MODEL_VERSION = "behavioral_baseline_v1";
const MIN_SAMPLE_SIZE = 50;

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

function safeLog(err: unknown): void {
  try {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.error) {
      console.error("[industryBehavioralBaseline]", err);
    }
  } catch {
    // no-op
  }
}

export interface IndustryBehavioralBaselineRow {
  industry: string;
  avg_pressure: number;
  avg_structure: number;
  avg_communication: number;
  avg_leadership: number;
  avg_reliability: number;
  avg_initiative: number;
  avg_conflict_risk: number;
  avg_tone_stability: number;
  sample_size: number;
  model_version: string;
}

/**
 * Recalculate industry behavioral baseline from all behavioral_profile_vector rows
 * for profiles in that industry. Upserts industry_behavioral_baselines.
 * Returns null if sample size < MIN_SAMPLE_SIZE.
 */
export async function recalculateIndustryBaseline(
  industry: string
): Promise<IndustryBehavioralBaselineRow | null> {
  const normalizedIndustry = (industry && String(industry).trim().toLowerCase()) || "corporate";
  try {
    const supabase = getSupabaseServer();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, industry");
    const list = (profiles ?? []) as unknown as { id: string; industry?: string | null }[];
    const profileIdsInIndustry = list
      .filter((p) => resolveIndustryKey(p.industry ?? null, null) === normalizedIndustry)
      .map((p) => p.id);
    if (profileIdsInIndustry.length < MIN_SAMPLE_SIZE) {
      safeLog(`Industry ${normalizedIndustry}: insufficient sample (${profileIdsInIndustry.length} < ${MIN_SAMPLE_SIZE})`);
      return null;
    }
    const { data: rows, error } = await supabase
      .from("behavioral_profile_vector")
      .select("*")
      .in("candidate_id", profileIdsInIndustry);
    if (error) {
      safeLog(error);
      return null;
    }
    const vectors = (rows ?? []) as Record<string, unknown>[];
    if (vectors.length < MIN_SAMPLE_SIZE) {
      safeLog(`Industry ${normalizedIndustry}: vectors count ${vectors.length} < ${MIN_SAMPLE_SIZE}`);
      return null;
    }
    let sumPressure = 0, sumStructure = 0, sumComm = 0, sumLead = 0, sumRel = 0, sumInit = 0, sumConflict = 0, sumTone = 0;
    for (const r of vectors) {
      sumPressure += safeNum(r.avg_pressure);
      sumStructure += safeNum(r.avg_structure);
      sumComm += safeNum(r.avg_communication);
      sumLead += safeNum(r.avg_leadership);
      sumRel += safeNum(r.avg_reliability);
      sumInit += safeNum(r.avg_initiative);
      sumConflict += safeNum(r.conflict_risk_level);
      sumTone += safeNum(r.tone_stability);
    }
    const n = vectors.length;
    const payload = {
      industry: normalizedIndustry,
      avg_pressure: clamp(sumPressure / n),
      avg_structure: clamp(sumStructure / n),
      avg_communication: clamp(sumComm / n),
      avg_leadership: clamp(sumLead / n),
      avg_reliability: clamp(sumRel / n),
      avg_initiative: clamp(sumInit / n),
      avg_conflict_risk: clamp(sumConflict / n),
      avg_tone_stability: clamp(sumTone / n),
      sample_size: n,
      model_version: MODEL_VERSION,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("industry_behavioral_baselines")
      .select("id")
      .eq("industry", normalizedIndustry)
      .maybeSingle();
    if ((existing as { id?: string } | null)?.id) {
      await supabase.from("industry_behavioral_baselines").update(payload).eq("industry", normalizedIndustry);
    } else {
      await supabase.from("industry_behavioral_baselines").insert(payload);
    }
    return payload;
  } catch (e) {
    safeLog(e);
    return null;
  }
}
