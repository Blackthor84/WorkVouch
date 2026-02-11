/**
 * Aggregate review_intelligence rows into behavioral_profile_vector for a candidate.
 * Weighted by extraction_confidence. Service role only. Never throws.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeLog(err: unknown): void {
  try {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.error) {
      console.error("[updateBehavioralVector]", err);
    }
  } catch {
    // no-op
  }
}

export interface BehavioralVectorRow {
  avg_pressure: number;
  avg_structure: number;
  avg_communication: number;
  avg_leadership: number;
  avg_reliability: number;
  avg_initiative: number;
  conflict_risk_level: number;
  tone_stability: number;
  review_density_weight: number;
}

/**
 * Pull all review_intelligence for candidate, compute weighted averages, upsert behavioral_profile_vector.
 */
export async function updateBehavioralVector(candidateId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const { data: rows, error: fetchError } = await supabase
      .from("review_intelligence")
      .select("*")
      .eq("candidate_id", candidateId);

    if (fetchError) {
      safeLog(fetchError);
      return;
    }

    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) return;

    let totalWeight = 0;
    const sum: Record<string, number> = {
      pressure_score: 0,
      structure_score: 0,
      communication_score: 0,
      leadership_score: 0,
      reliability_score: 0,
      initiative_score: 0,
      conflict_indicator: 0,
      tone_variance_score: 0,
    };

    for (const r of list as Record<string, unknown>[]) {
      const w = Math.max(0.1, safeNum(r.extraction_confidence) / 100);
      totalWeight += w;
      sum.pressure_score += safeNum(r.pressure_score) * w;
      sum.structure_score += safeNum(r.structure_score) * w;
      sum.communication_score += safeNum(r.communication_score) * w;
      sum.leadership_score += safeNum(r.leadership_score) * w;
      sum.reliability_score += safeNum(r.reliability_score) * w;
      sum.initiative_score += safeNum(r.initiative_score) * w;
      sum.conflict_indicator += safeNum(r.conflict_indicator) * w;
      sum.tone_variance_score += safeNum(r.tone_variance_score) * w;
    }

    if (totalWeight <= 0) return;

    const avg_pressure = clamp(sum.pressure_score / totalWeight);
    const avg_structure = clamp(sum.structure_score / totalWeight);
    const avg_communication = clamp(sum.communication_score / totalWeight);
    const avg_leadership = clamp(sum.leadership_score / totalWeight);
    const avg_reliability = clamp(sum.reliability_score / totalWeight);
    const avg_initiative = clamp(sum.initiative_score / totalWeight);
    const conflict_risk_level = clamp(sum.conflict_indicator / totalWeight);
    const tone_stability = clamp(100 - sum.tone_variance_score / totalWeight);
    const review_density_weight = clamp(Math.min(100, list.length * 15));
    const last_updated = new Date().toISOString();

    const payload = {
      candidate_id: candidateId,
      avg_pressure,
      avg_structure,
      avg_communication,
      avg_leadership,
      avg_reliability,
      avg_initiative,
      conflict_risk_level,
      tone_stability,
      review_density_weight,
      last_updated,
    };

    const { data: existing } = await supabase
      .from("behavioral_profile_vector")
      .select("id")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("behavioral_profile_vector").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("behavioral_profile_vector").insert(payload);
    }

    triggerBaselineRecalc(candidateId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
  } catch (e) {
    safeLog(e);
  }
}

/**
 * Async trigger: recalc industry + employer baselines after vector update. Never blocks.
 */
async function triggerBaselineRecalc(candidateId: string): Promise<void> {
  try {
    const { getSupabaseServer } = await import("@/lib/supabase/admin");
    const { resolveIndustryKey } = await import("@/lib/industry-normalization");
    const { recalculateIndustryBaseline } = await import("./industryBehavioralBaseline");
    const { recalculateEmployerBaseline } = await import("./employerBehavioralBaseline");
    const supabase = getSupabaseServer();
    const { data: profile } = await supabase.from("profiles").select("industry, industry_key").eq("id", candidateId).maybeSingle();
    const industryKey = resolveIndustryKey((profile as { industry_key?: string } | null)?.industry_key, (profile as { industry?: string } | null)?.industry);
    const { data: records } = await supabase.from("employment_records").select("marked_by_employer_id").eq("user_id", candidateId).not("marked_by_employer_id", "is", null);
    const employerIds = [...new Set((records ?? []).map((r: { marked_by_employer_id?: string | null }) => r.marked_by_employer_id).filter(Boolean))] as string[];
    await Promise.all([
      recalculateIndustryBaseline(industryKey),
      ...employerIds.map((id) => recalculateEmployerBaseline(id)),
    ]);
  } catch {
    // no-op
  }
}
