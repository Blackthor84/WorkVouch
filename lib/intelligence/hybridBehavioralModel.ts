/**
 * Hybrid behavioral baseline: blend industry (macro) + employer (micro).
 * Powers Team Fit, Risk, and Hiring Confidence. No mock data; versioned.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { resolveIndustryKey } from "@/lib/industry-normalization";

const EMPLOYER_SAMPLE_THRESHOLD = 5;
const MIN_EMPLOYER_WEIGHT = 0.25;
const MAX_EMPLOYER_WEIGHT = 0.7;

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

export interface BehavioralBaselineVector {
  avg_pressure: number;
  avg_structure: number;
  avg_communication: number;
  avg_leadership: number;
  avg_reliability: number;
  avg_initiative: number;
  avg_conflict_risk: number;
  avg_tone_stability: number;
  industry_sample_size?: number;
  employer_sample_size?: number;
  employer_weight?: number;
  industry_weight?: number;
}

function zeroVector(): BehavioralBaselineVector {
  return {
    avg_pressure: 50,
    avg_structure: 50,
    avg_communication: 50,
    avg_leadership: 50,
    avg_reliability: 50,
    avg_initiative: 50,
    avg_conflict_risk: 50,
    avg_tone_stability: 50,
  };
}

export interface SandboxOptions {
  sandboxSessionId?: string;
}

/**
 * Fetch industry behavioral baseline row from DB. Returns null if missing.
 * If options.sandboxSessionId is set, reads from sandbox_industry_baselines for that session only.
 */
export async function getIndustryBehavioralBaseline(
  industry: string,
  options?: SandboxOptions
): Promise<BehavioralBaselineVector & { sample_size: number } | null> {
  const key = (industry && String(industry).trim().toLowerCase()) || "corporate";
  try {
    const supabase = getSupabaseServer() as any;
    if (options?.sandboxSessionId) {
      const { data, error } = await supabase
        .from("sandbox_industry_baselines")
        .select("*")
        .eq("sandbox_session_id", options.sandboxSessionId)
        .eq("industry", key)
        .eq("is_sandbox", true)
        .maybeSingle();
      if (error || !data || typeof data !== "object") return null;
      const r = data as Record<string, unknown>;
      return {
        avg_pressure: safeNum(r.avg_pressure),
        avg_structure: safeNum(r.avg_structure),
        avg_communication: safeNum(r.avg_communication),
        avg_leadership: safeNum(r.avg_leadership),
        avg_reliability: safeNum(r.avg_reliability),
        avg_initiative: safeNum(r.avg_initiative),
        avg_conflict_risk: safeNum(r.avg_conflict_risk),
        avg_tone_stability: safeNum(r.avg_tone_stability),
        sample_size: Number(r.sample_size) || 0,
      };
    }
    const { data, error } = await supabase
      .from("industry_behavioral_baselines")
      .select("*")
      .eq("industry", key)
      .maybeSingle();
    if (error || !data || typeof data !== "object") return null;
    const r = data as Record<string, unknown>;
    return {
      avg_pressure: safeNum(r.avg_pressure),
      avg_structure: safeNum(r.avg_structure),
      avg_communication: safeNum(r.avg_communication),
      avg_leadership: safeNum(r.avg_leadership),
      avg_reliability: safeNum(r.avg_reliability),
      avg_initiative: safeNum(r.avg_initiative),
      avg_conflict_risk: safeNum(r.avg_conflict_risk),
      avg_tone_stability: safeNum(r.avg_tone_stability),
      sample_size: Number(r.sample_size) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch employer behavioral baseline row from DB. Returns null if missing.
 * If options.sandboxSessionId is set, reads from sandbox_employer_baselines for that session only.
 */
export async function getEmployerBehavioralBaseline(
  employerId: string,
  options?: SandboxOptions
): Promise<(BehavioralBaselineVector & { employee_sample_size: number }) | null> {
  try {
    const supabase = getSupabaseServer() as any;
    if (options?.sandboxSessionId) {
      const { data, error } = await supabase
        .from("sandbox_employer_baselines")
        .select("*")
        .eq("sandbox_session_id", options.sandboxSessionId)
        .eq("employer_id", employerId)
        .eq("is_sandbox", true)
        .maybeSingle();
      if (error || !data || typeof data !== "object") return null;
      const r = data as Record<string, unknown>;
      return {
        avg_pressure: safeNum(r.avg_pressure),
        avg_structure: safeNum(r.avg_structure),
        avg_communication: safeNum(r.avg_communication),
        avg_leadership: safeNum(r.avg_leadership),
        avg_reliability: safeNum(r.avg_reliability),
        avg_initiative: safeNum(r.avg_initiative),
        avg_conflict_risk: safeNum(r.avg_conflict_risk),
        avg_tone_stability: safeNum(r.avg_tone_stability),
        employee_sample_size: Number(r.employee_sample_size) || 0,
      };
    }
    const { data, error } = await supabase
      .from("employer_behavioral_baselines")
      .select("*")
      .eq("employer_id", employerId)
      .maybeSingle();
    if (error || !data || typeof data !== "object") return null;
    const r = data as Record<string, unknown>;
    return {
      avg_pressure: safeNum(r.avg_pressure),
      avg_structure: safeNum(r.avg_structure),
      avg_communication: safeNum(r.avg_communication),
      avg_leadership: safeNum(r.avg_leadership),
      avg_reliability: safeNum(r.avg_reliability),
      avg_initiative: safeNum(r.avg_initiative),
      avg_conflict_risk: safeNum(r.avg_conflict_risk),
      avg_tone_stability: safeNum(r.avg_tone_stability),
      employee_sample_size: Number(r.employee_sample_size) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Blended baseline: employer_weight * employer + industry_weight * industry.
 * If employer sample < threshold: weight = 0.25 employer / 0.75 industry.
 * Else: employer_weight = min(0.7, employee_sample_size / 100), industry_weight = 1 - employer_weight.
 * When options.sandboxSessionId is set, reads only from sandbox_* baselines; never mixes with production.
 */
export async function getHybridBehavioralBaseline(
  candidateIndustry: string,
  employerId: string,
  options?: SandboxOptions
): Promise<BehavioralBaselineVector> {
  const industryKey = (candidateIndustry && String(candidateIndustry).trim().toLowerCase()) || "corporate";
  const [industryRow, employerRow] = await Promise.all([
    getIndustryBehavioralBaseline(industryKey, options),
    getEmployerBehavioralBaseline(employerId, options),
  ]);

  const industry = industryRow ?? zeroVector();
  const empSample = employerRow?.employee_sample_size ?? 0;

  let employerWeight: number;
  let industryWeight: number;
  if (empSample < EMPLOYER_SAMPLE_THRESHOLD) {
    employerWeight = MIN_EMPLOYER_WEIGHT;
    industryWeight = 1 - employerWeight;
  } else {
    employerWeight = Math.min(MAX_EMPLOYER_WEIGHT, empSample / 100);
    industryWeight = 1 - employerWeight;
  }

  const employer = employerRow ?? industry;
  const blend = (a: number, b: number) => clamp(employerWeight * a + industryWeight * b);
  return {
    avg_pressure: blend(safeNum(employer.avg_pressure), safeNum(industry.avg_pressure)),
    avg_structure: blend(safeNum(employer.avg_structure), safeNum(industry.avg_structure)),
    avg_communication: blend(safeNum(employer.avg_communication), safeNum(industry.avg_communication)),
    avg_leadership: blend(safeNum(employer.avg_leadership), safeNum(industry.avg_leadership)),
    avg_reliability: blend(safeNum(employer.avg_reliability), safeNum(industry.avg_reliability)),
    avg_initiative: blend(safeNum(employer.avg_initiative), safeNum(industry.avg_initiative)),
    avg_conflict_risk: blend(safeNum(employer.avg_conflict_risk), safeNum(industry.avg_conflict_risk)),
    avg_tone_stability: blend(safeNum(employer.avg_tone_stability), safeNum(industry.avg_tone_stability)),
    industry_sample_size: industryRow?.sample_size,
    employer_sample_size: empSample,
    employer_weight: employerWeight,
    industry_weight: industryWeight,
  };
}
