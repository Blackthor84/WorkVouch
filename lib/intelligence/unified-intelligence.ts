/**
 * Unified enterprise intelligence: single canonical model.
 * Composes existing engines (risk-model, network-density, team-fit, hiring-confidence, trust).
 * No duplicate math; all scores from engine outputs. Persists to intelligence_snapshots.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrCreateSnapshot } from "./getOrCreateSnapshot";
import { runCandidateIntelligence, runEmployerCandidateIntelligence } from "./runIntelligencePipeline";

export const UNIFIED_MODEL_VERSION = "v1.0-enterprise";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface UnifiedIntelligenceResult {
  profile_strength: number;
  career_health: number;
  stability_score: number;
  reference_score: number;
  rehire_probability: number;
  dispute_score: number;
  network_density_score: number;
  fraud_confidence: number;
  overall_risk_score: number;
  hiring_confidence_score: number | null;
  team_fit_score: number | null;
  model_version: string;
}

interface RiskBreakdown {
  tenureStabilityScore?: number;
  referenceResponseRate?: number;
  rehireLikelihoodIndex?: number;
  employmentGapScore?: number;
  disputeRiskScore?: number;
}

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[unified-intelligence:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

/**
 * Run candidate + optional employer pipelines, then read all engine outputs and compose unified view.
 * Never throws; returns neutral scores on failure.
 */
export async function calculateUnifiedIntelligence(
  userId: string,
  employerId?: string | null
): Promise<UnifiedIntelligenceResult> {
  const neutral: UnifiedIntelligenceResult = {
    profile_strength: 0,
    career_health: 0,
    stability_score: 0,
    reference_score: 0,
    rehire_probability: 0,
    dispute_score: 100,
    network_density_score: 0,
    fraud_confidence: 0,
    overall_risk_score: 50,
    hiring_confidence_score: null,
    team_fit_score: null,
    model_version: UNIFIED_MODEL_VERSION,
  };

  try {
    await runCandidateIntelligence(userId).catch((e) => safeLog("runCandidateIntelligence", e));
    if (employerId) {
      await runEmployerCandidateIntelligence(userId, employerId).catch((e) =>
        safeLog("runEmployerCandidateIntelligence", e)
      );
    }

    const supabase = getSupabaseServer();
    const [riskRes, networkRes, teamRes, hiringRes] = await Promise.all([
      supabase
        .from("risk_model_outputs")
        .select("overall_score, breakdown")
        .eq("candidate_id", userId)
        .is("employer_id", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("network_density_index")
        .select("density_score, fraud_confidence")
        .eq("candidate_id", userId)
        .maybeSingle(),
      employerId
        ? supabase
            .from("team_fit_scores")
            .select("alignment_score")
            .eq("candidate_id", userId)
            .eq("employer_id", employerId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      employerId
        ? supabase
            .from("hiring_confidence_scores")
            .select("composite_score")
            .eq("candidate_id", userId)
            .eq("employer_id", employerId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const riskRow = riskRes.data as { overall_score?: number; breakdown?: RiskBreakdown } | null;
    const networkRow = networkRes.data as { density_score?: number; fraud_confidence?: number } | null;
    const teamRow = teamRes.data as { alignment_score?: number } | null;
    const hiringRow = hiringRes.data as { composite_score?: number } | null;

    const breakdown = (riskRow?.breakdown ?? {}) as RiskBreakdown;
    const tenure_score = clamp(safeNum(breakdown.tenureStabilityScore ?? 0));
    const reference_score = clamp(safeNum(breakdown.referenceResponseRate ?? 0));
    const rehire_score = clamp(safeNum(breakdown.rehireLikelihoodIndex ?? 0));
    const dispute_score = clamp(safeNum(breakdown.disputeRiskScore ?? 100));
    const overall_risk_score = clamp(safeNum(riskRow?.overall_score ?? 50));

    const densityRaw = safeNum(networkRow?.density_score ?? 0);
    const network_density_score = clamp(densityRaw <= 1 ? densityRaw * 100 : densityRaw);
    const fraudConfidenceRaw = safeNum(networkRow?.fraud_confidence ?? 0);
    const fraud_confidence = clamp(fraudConfidenceRaw <= 1 ? fraudConfidenceRaw * 100 : fraudConfidenceRaw);

    const team_fit_score = employerId && teamRow?.alignment_score != null ? clamp(teamRow.alignment_score) : null;
    const hiring_confidence_score =
      employerId && hiringRow?.composite_score != null ? clamp(hiringRow.composite_score) : null;

    const stability_score = tenure_score;

    const profile_strength = clamp(
      tenure_score * 0.25 +
        reference_score * 0.25 +
        rehire_score * 0.2 +
        network_density_score * 0.15 +
        dispute_score * 0.15
    );
    const career_health = clamp(
      tenure_score * 0.4 + reference_score * 0.2 + rehire_score * 0.2 + dispute_score * 0.2
    );

    return {
      profile_strength,
      career_health,
      stability_score,
      reference_score,
      rehire_probability: rehire_score,
      dispute_score,
      network_density_score,
      fraud_confidence,
      overall_risk_score,
      hiring_confidence_score: hiring_confidence_score ?? null,
      team_fit_score: team_fit_score ?? null,
      model_version: UNIFIED_MODEL_VERSION,
    };
  } catch (e) {
    safeLog("calculateUnifiedIntelligence", e);
    return neutral;
  }
}

/**
 * Persist unified result to intelligence_snapshots (canonical view). Never throws.
 */
export async function persistUnifiedIntelligence(userId: string): Promise<void> {
  try {
    const result = await calculateUnifiedIntelligence(userId, null);
    const snapshot = await getOrCreateSnapshot(userId);
    const now = new Date().toISOString();
    const supabase = getSupabaseServer();

    const row = {
      profile_strength: result.profile_strength,
      career_health_score: result.career_health,
      tenure_score: result.stability_score,
      reference_score: result.reference_score,
      rehire_score: result.rehire_probability,
      dispute_score: result.dispute_score,
      network_density_score: result.network_density_score,
      last_calculated_at: now,
      updated_at: now,
      model_version: UNIFIED_MODEL_VERSION,
    };

    const { error } = await supabase.from("intelligence_snapshots").update(row).eq("user_id", userId);

    if (error && snapshot.id) {
      await supabase.from("intelligence_snapshots").update({ ...row, updated_at: now }).eq("id", snapshot.id);
    } else if (error) {
      await supabase.from("intelligence_snapshots").insert({
        user_id: userId,
        ...row,
        created_at: now,
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Unified intelligence persisted for user ${userId}`);
    }
  } catch (e) {
    safeLog("persistUnifiedIntelligence", e);
  }
}

/**
 * Employer-level workforce intelligence: delegate to existing workforce risk, then aggregate.
 * Never throws.
 */
export async function calculateWorkforceIntelligence(employerId: string): Promise<void> {
  try {
    const { calculateEmployerWorkforceRisk } = await import("./engines");
    await calculateEmployerWorkforceRisk(employerId).catch((e) => safeLog("calculateWorkforceIntelligence", e));
  } catch (e) {
    safeLog("calculateWorkforceIntelligence", e);
  }
}
