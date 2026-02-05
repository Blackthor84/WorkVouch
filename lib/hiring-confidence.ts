/**
 * Enterprise hiring confidence composite. Server-side only.
 * Accepts candidateId and employerId; aggregates team_fit, risk_model_outputs, network_density; persists to hiring_confidence_scores.
 * When simulationContext is provided, rows are tagged with simulation_session_id. Optional; production path unchanged.
 */

import type { SimulationContext } from "@/lib/simulation/types";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import { getHybridBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import { resolveIndustryKey } from "@/lib/industry-normalization";

const MODEL_VERSION = "1";
const NEUTRAL_SCORE = 50;

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[hiring-confidence:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

function baselineAlignmentFactor(
  candidateVector: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; conflict_risk_level: number; tone_stability: number },
  baseline: { avg_pressure: number; avg_structure: number; avg_communication: number; avg_leadership: number; avg_reliability: number; avg_initiative: number; avg_conflict_risk: number; avg_tone_stability: number }
): number {
  const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative"] as const;
  let sumDiff = 0;
  for (const k of keys) sumDiff += Math.abs((candidateVector[k] ?? 0) - (baseline[k] ?? 0));
  sumDiff += Math.abs((candidateVector.conflict_risk_level ?? 0) - (baseline.avg_conflict_risk ?? 0));
  sumDiff += Math.abs((candidateVector.tone_stability ?? 0) - (baseline.avg_tone_stability ?? 0));
  return clamp(100 - sumDiff / 8);
}

/**
 * Load latest team_fit_scores, risk_model_outputs, network_density_index for candidate (and employer when applicable).
 */
async function loadComponentScores(
  supabase: ReturnType<typeof getSupabaseServer>,
  candidateId: string,
  employerId: string
): Promise<{
  teamFitScore: number | null;
  riskScore: number | null;
  densityScore: number | null;
  fraudConfidence: number | null;
}> {
  try {
    const [teamRes, riskRes, riskGlobalRes, networkRes] = await Promise.all([
      supabase
        .from("team_fit_scores")
        .select("alignment_score")
        .eq("candidate_id", candidateId)
        .eq("employer_id", employerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("risk_model_outputs")
        .select("overall_score")
        .eq("candidate_id", candidateId)
        .eq("employer_id", employerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("risk_model_outputs")
        .select("overall_score")
        .eq("candidate_id", candidateId)
        .is("employer_id", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("network_density_index")
        .select("density_score, fraud_confidence")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
    ]);
    const teamFit = (teamRes.data as { alignment_score?: number } | null)?.alignment_score ?? null;
    const riskRow = (riskRes.data ?? riskGlobalRes.data) as { overall_score?: number } | null;
    const riskScore = riskRow?.overall_score ?? null;
    const netRow = networkRes.data as { density_score?: number; fraud_confidence?: number } | null;
    const densityScore = netRow?.density_score ?? null;
    const fraudConfidence = netRow?.fraud_confidence ?? null;
    return { teamFitScore: teamFit, riskScore, densityScore, fraudConfidence };
  } catch (e) {
    safeLog("loadComponentScores", e);
    return { teamFitScore: null, riskScore: null, densityScore: null, fraudConfidence: null };
  }
}

/**
 * Composite hiring confidence: weighted blend of team fit, risk (inverted: lower risk = higher), density, fraud (inverted).
 * Weights: team fit 0.35, risk 0.30, density 0.20, fraud penalty 0.15.
 */
export async function computeAndPersistHiringConfidence(
  candidateId: string,
  employerId: string,
  simulationContext?: SimulationContext
): Promise<{ compositeScore: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer();
    const { teamFitScore, riskScore, densityScore, fraudConfidence } = await loadComponentScores(
      supabase,
      candidateId,
      employerId
    );

    const team = Number.isFinite(teamFitScore) ? teamFitScore! : NEUTRAL_SCORE;
    const risk = Number.isFinite(riskScore) ? riskScore! : NEUTRAL_SCORE;
    const density = Number.isFinite(densityScore) ? (densityScore as number) * 100 : NEUTRAL_SCORE;
    const fraud = Number.isFinite(fraudConfidence) ? (fraudConfidence as number) * 100 : 0;
    const fraudPenalty = 100 - fraud;

    let baselineAlignment = NEUTRAL_SCORE;
    const [candidateProfile, candidateVector] = await Promise.all([
      supabase.from("profiles").select("industry, industry_key").eq("id", candidateId).maybeSingle(),
      getBehavioralVector(candidateId),
    ]);
    if (candidateVector) {
      const profileRow = candidateProfile?.data as { industry?: string; industry_key?: string } | null;
      const candidateIndustry = resolveIndustryKey(profileRow?.industry_key, profileRow?.industry);
      const hybrid = await getHybridBehavioralBaseline(candidateIndustry, employerId);
      baselineAlignment = baselineAlignmentFactor(candidateVector, hybrid);
    }
    const composite = clamp(
      team * 0.30 +
        risk * 0.25 +
        density * 0.20 +
        fraudPenalty * 0.10 +
        baselineAlignment * 0.15
    );

    const breakdown = {
      teamFitScore: team,
      riskScore: risk,
      densityScore: density,
      fraudConfidence: fraud,
      fraudPenaltyScore: fraudPenalty,
      baselineAlignmentFactor: baselineAlignment,
    };

    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      candidate_id: candidateId,
      employer_id: employerId,
      model_version: MODEL_VERSION,
      composite_score: composite,
      breakdown: breakdown as unknown as Record<string, unknown>,
      updated_at: now,
    };
    if (simulationContext) {
      row.expires_at = simulationContext.expiresAt;
      if (simulationContext.simulationSessionId) {
        row.is_simulation = true;
        row.simulation_session_id = simulationContext.simulationSessionId;
      }
      if (simulationContext.sandboxId) row.sandbox_id = simulationContext.sandboxId;
    }
    const { data: existing } = await supabase
      .from("hiring_confidence_scores")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("hiring_confidence_scores").update(row).eq("id", (existing as { id: string }).id);
    } else {
      const insertRow: Record<string, unknown> = {
        candidate_id: candidateId,
        employer_id: employerId,
        model_version: MODEL_VERSION,
        composite_score: composite,
        breakdown: breakdown as unknown as Record<string, unknown>,
      };
      if (simulationContext) {
        insertRow.expires_at = simulationContext.expiresAt;
        if (simulationContext.simulationSessionId) {
          insertRow.is_simulation = true;
          insertRow.simulation_session_id = simulationContext.simulationSessionId;
        }
        if (simulationContext.sandboxId) insertRow.sandbox_id = simulationContext.sandboxId;
      }
      await supabase.from("hiring_confidence_scores").insert(insertRow);
    }
    return { compositeScore: composite, breakdown };
  } catch (e) {
    safeLog("computeAndPersistHiringConfidence", e);
    return null;
  }
}
