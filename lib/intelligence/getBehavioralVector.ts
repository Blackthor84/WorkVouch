/**
 * Load behavioral_profile_vector for a candidate. Service role. Returns null if missing.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export interface BehavioralVector {
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

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getBehavioralVector(candidateId: string): Promise<BehavioralVector | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("behavioral_profile_vector")
      .select("*")
      .eq("candidate_id", candidateId)
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
      conflict_risk_level: safeNum(r.conflict_risk_level),
      tone_stability: safeNum(r.tone_stability),
      review_density_weight: safeNum(r.review_density_weight),
    };
  } catch {
    return null;
  }
}

/**
 * Load sandbox_behavioral_profile_vector for a sandbox profile. Service role. Returns null if missing.
 * Use only when sandboxSessionId is in context; never mix with production.
 */
export async function getSandboxBehavioralVector(sandboxProfileId: string): Promise<BehavioralVector | null> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data, error } = await supabase
      .from("sandbox_behavioral_profile_vector")
      .select("*")
      .eq("profile_id", sandboxProfileId)
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
      conflict_risk_level: safeNum(r.conflict_risk_level),
      tone_stability: safeNum(r.tone_stability),
      review_density_weight: safeNum(r.review_density_weight),
    };
  } catch {
    return null;
  }
}
