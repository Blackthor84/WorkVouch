/**
 * Enterprise hiring confidence composite. Server-side only.
 * Accepts candidateId and employerId; aggregates team_fit, risk_model_outputs, network_density; persists to hiring_confidence_scores.
 * Never exposes to employees. Fail gracefully; neutral if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

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
  employerId: string
): Promise<{ compositeScore: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer() as any;
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
    const composite = clamp(
      team * 0.35 +
        risk * 0.30 +
        density * 0.20 +
        fraudPenalty * 0.15
    );

    const breakdown = {
      teamFitScore: team,
      riskScore: risk,
      densityScore: density,
      fraudConfidence: fraud,
      fraudPenaltyScore: fraudPenalty,
    };

    const row = {
      candidate_id: candidateId,
      employer_id: employerId,
      model_version: MODEL_VERSION,
      composite_score: composite,
      breakdown: breakdown as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("hiring_confidence_scores")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("hiring_confidence_scores").update(row).eq("id", existing.id);
    } else {
      await supabase.from("hiring_confidence_scores").insert({
        candidate_id: candidateId,
        employer_id: employerId,
        model_version: MODEL_VERSION,
        composite_score: composite,
        breakdown: breakdown as unknown as Record<string, unknown>,
      });
    }
    return { compositeScore: composite, breakdown };
  } catch (e) {
    safeLog("computeAndPersistHiringConfidence", e);
    return null;
  }
}
