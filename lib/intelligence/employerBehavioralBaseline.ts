/**
 * Employer behavioral baseline engine. Service role only.
 * Aggregates behavioral_profile_vector for employees linked to employer (employment_records).
 * Min employee sample required; fallback to industry baseline if insufficient.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { resolveIndustryKey } from "@/lib/industry-normalization";
import { getIndustryBehavioralBaseline } from "./hybridBehavioralModel";

const MIN_EMPLOYEE_SAMPLE_SIZE = 5;

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
      console.error("[employerBehavioralBaseline]", err);
    }
  } catch {
    // no-op
  }
}

export interface EmployerBehavioralBaselineRow {
  employer_id: string;
  avg_pressure: number;
  avg_structure: number;
  avg_communication: number;
  avg_leadership: number;
  avg_reliability: number;
  avg_initiative: number;
  avg_conflict_risk: number;
  avg_tone_stability: number;
  employee_sample_size: number;
}

/**
 * Recalculate employer behavioral baseline from employees (employment_records where
 * marked_by_employer_id = employerId, verified/matched). Upserts employer_behavioral_baselines.
 * If employee_sample_size < MIN_EMPLOYEE_SAMPLE_SIZE, fallback: copy industry baseline for this employer's industry.
 */
export async function recalculateEmployerBaseline(
  employerId: string
): Promise<EmployerBehavioralBaselineRow | null> {
  try {
    const supabase = getSupabaseServer();
    const { data: employer } = await supabase
      .from("employer_accounts")
      .select("industry_type, industry_key")
      .eq("id", employerId)
      .maybeSingle();
    const industryKey = resolveIndustryKey(
      (employer as { industry_key?: string } | null)?.industry_key,
      (employer as { industry_type?: string } | null)?.industry_type
    );

    const { data: records } = await supabase
      .from("employment_records")
      .select("user_id")
      .eq("marked_by_employer_id", employerId)
      .in("verification_status", ["verified", "matched"]);
    const recs = (records ?? []) as { user_id: string }[];
    const employeeIds = [...new Set(recs.map((r) => r.user_id))];

    if (employeeIds.length < MIN_EMPLOYEE_SAMPLE_SIZE) {
      const industryBaseline = await getIndustryBehavioralBaseline(industryKey);
      if (!industryBaseline) return null;
      const payload = {
        employer_id: employerId,
        avg_pressure: industryBaseline.avg_pressure,
        avg_structure: industryBaseline.avg_structure,
        avg_communication: industryBaseline.avg_communication,
        avg_leadership: industryBaseline.avg_leadership,
        avg_reliability: industryBaseline.avg_reliability,
        avg_initiative: industryBaseline.avg_initiative,
        avg_conflict_risk: industryBaseline.avg_conflict_risk,
        avg_tone_stability: industryBaseline.avg_tone_stability,
        employee_sample_size: 0,
        last_updated: new Date().toISOString(),
      };
      const { data: existing } = await supabase
        .from("employer_behavioral_baselines")
        .select("id")
        .eq("employer_id", employerId)
        .maybeSingle();
      if ((existing as { id?: string } | null)?.id) {
        await supabase.from("employer_behavioral_baselines").update(payload).eq("employer_id", employerId);
      } else {
        await supabase.from("employer_behavioral_baselines").insert(payload);
      }
      return { ...payload, employee_sample_size: 0 };
    }

    const { data: rows, error } = await supabase
      .from("behavioral_profile_vector")
      .select("*")
      .in("candidate_id", employeeIds);
    if (error) {
      safeLog(error);
      const industryBaseline = await getIndustryBehavioralBaseline(industryKey);
      if (industryBaseline) {
        const payload = {
          employer_id: employerId,
          ...industryBaseline,
          employee_sample_size: 0,
          last_updated: new Date().toISOString(),
        };
        await supabase.from("employer_behavioral_baselines").upsert({
          employer_id: employerId,
          avg_pressure: payload.avg_pressure,
          avg_structure: payload.avg_structure,
          avg_communication: payload.avg_communication,
          avg_leadership: payload.avg_leadership,
          avg_reliability: payload.avg_reliability,
          avg_initiative: payload.avg_initiative,
          avg_conflict_risk: payload.avg_conflict_risk,
          avg_tone_stability: payload.avg_tone_stability,
          employee_sample_size: 0,
          last_updated: payload.last_updated,
        }, { onConflict: "employer_id" });
      }
      return null;
    }
    const vectors = (rows ?? []) as Record<string, unknown>[];
    if (vectors.length < MIN_EMPLOYEE_SAMPLE_SIZE) {
      const industryBaseline = await getIndustryBehavioralBaseline(industryKey);
      if (!industryBaseline) return null;
      const payload = {
        employer_id: employerId,
        avg_pressure: industryBaseline.avg_pressure,
        avg_structure: industryBaseline.avg_structure,
        avg_communication: industryBaseline.avg_communication,
        avg_leadership: industryBaseline.avg_leadership,
        avg_reliability: industryBaseline.avg_reliability,
        avg_initiative: industryBaseline.avg_initiative,
        avg_conflict_risk: industryBaseline.avg_conflict_risk,
        avg_tone_stability: industryBaseline.avg_tone_stability,
        employee_sample_size: vectors.length,
        last_updated: new Date().toISOString(),
      };
      const { data: existing } = await supabase
        .from("employer_behavioral_baselines")
        .select("id")
        .eq("employer_id", employerId)
        .maybeSingle();
      if ((existing as { id?: string } | null)?.id) {
        await supabase.from("employer_behavioral_baselines").update(payload).eq("employer_id", employerId);
      } else {
        await supabase.from("employer_behavioral_baselines").insert(payload);
      }
      return { ...payload, employee_sample_size: vectors.length };
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
      employer_id: employerId,
      avg_pressure: clamp(sumPressure / n),
      avg_structure: clamp(sumStructure / n),
      avg_communication: clamp(sumComm / n),
      avg_leadership: clamp(sumLead / n),
      avg_reliability: clamp(sumRel / n),
      avg_initiative: clamp(sumInit / n),
      avg_conflict_risk: clamp(sumConflict / n),
      avg_tone_stability: clamp(sumTone / n),
      employee_sample_size: n,
      last_updated: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("employer_behavioral_baselines")
      .select("id")
      .eq("employer_id", employerId)
      .maybeSingle();
    if ((existing as { id?: string } | null)?.id) {
      await supabase.from("employer_behavioral_baselines").update(payload).eq("employer_id", employerId);
    } else {
      await supabase.from("employer_behavioral_baselines").insert(payload);
    }
    return payload;
  } catch (e) {
    safeLog(e);
    return null;
  }
}

/**
 * Schedule employer baseline recalc async (e.g. when employee added/removed).
 * Does not block. Call from API after employment_records insert/update/delete with marked_by_employer_id.
 */
export function scheduleEmployerBaselineRecalc(employerId: string): void {
  recalculateEmployerBaseline(employerId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });
}
