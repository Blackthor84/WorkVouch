/**
 * Enterprise risk model. Server-side only.
 * Accepts candidateId and optional employerId; computes risk; persists to risk_model_outputs.
 * Never exposes to employees. Fail gracefully; neutral score if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateRiskSnapshot, type RiskSnapshotInput } from "@/lib/intelligence/riskEngine";

const MODEL_VERSION = "1";
const NEUTRAL_SCORE = 50;

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[risk-model:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

/**
 * Load candidate data for risk snapshot input (employment, disputes, references, tenure).
 */
async function loadRiskInput(
  supabase: ReturnType<typeof getSupabaseServer>,
  candidateId: string
): Promise<RiskSnapshotInput | null> {
  try {
    const [jobsRes, disputesRes, refsRes, rehireRes] = await Promise.all([
      supabase.from("employment_records").select("id, start_date, end_date").eq("user_id", candidateId).in("verification_status", ["verified", "matched", "pending"]),
      supabase.from("compliance_disputes").select("id, status").eq("profile_id", candidateId),
      supabase.from("employment_references").select("id, created_at").eq("reviewed_user_id", candidateId),
      supabase.from("rehire_registry").select("id").eq("profile_id", candidateId),
    ]);
    const jobs = (jobsRes.data ?? []) as { id: string; start_date?: string; end_date?: string | null }[];
    const disputes = (disputesRes.data ?? []) as { id: string; status?: string }[];
    const refs = (refsRes.data ?? []) as { id: string; created_at?: string }[];
    const rehireRows = (rehireRes.data ?? []) as { id: string }[];
    const rehireEligible = rehireRows.length > 0;

    const verifiedJobs = jobs.map((j) => ({
      startDate: j.start_date,
      endDate: j.end_date,
      tenureMonths: j.start_date && (j.end_date ? new Date(j.end_date) : new Date()) >= new Date(j.start_date)
        ? (j.end_date ? new Date(j.end_date).getTime() : Date.now() - new Date(j.start_date).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        : undefined,
    }));
    const tenureHistory = jobs.map((j) => ({
      startDate: j.start_date ?? "",
      endDate: j.end_date ?? null,
      months: j.start_date && (j.end_date ? new Date(j.end_date) : new Date()) >= new Date(j.start_date)
        ? Math.floor((j.end_date ? new Date(j.end_date).getTime() : Date.now() - new Date(j.start_date).getTime()) / (30.44 * 24 * 60 * 60 * 1000))
        : undefined,
    }));
    const referenceResponses = refs.map((r) => ({ respondedAt: r.created_at, requestedAt: r.created_at, responseTimeHours: 0 }));
    const rehireFlag = rehireEligible;

    return {
      verifiedJobs,
      disputes: disputes.map((d) => ({ status: d.status, resolved: d.status === "Resolved" })),
      referenceResponses,
      tenureHistory,
      rehireFlag,
    };
  } catch (e) {
    safeLog("loadRiskInput", e);
    return null;
  }
}

/**
 * Compute risk model and persist to risk_model_outputs.
 * Returns overall score 0–100 or null on failure. Never throws.
 */
export async function computeAndPersistRiskModel(
  candidateId: string,
  employerId?: string | null
): Promise<{ overallScore: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer() as any;
    const input = await loadRiskInput(supabase, candidateId);
    if (!input) {
      await upsertRiskOutput(supabase, candidateId, employerId ?? null, NEUTRAL_SCORE, {});
      return { overallScore: NEUTRAL_SCORE, breakdown: {} };
    }

    const snapshot = calculateRiskSnapshot(input);
    const overallScore = clamp(snapshot.overallRiskScore);
    const breakdown = {
      tenureStabilityScore: snapshot.tenureStabilityScore,
      referenceResponseRate: snapshot.referenceResponseRate,
      rehireLikelihoodIndex: snapshot.rehireLikelihoodIndex,
      employmentGapScore: snapshot.employmentGapScore,
      disputeRiskScore: snapshot.disputeRiskScore,
    };

    await upsertRiskOutput(supabase, candidateId, employerId ?? null, overallScore, breakdown);
    return { overallScore, breakdown };
  } catch (e) {
    safeLog("computeAndPersistRiskModel", e);
    try {
      const supabase = getSupabaseServer() as any;
      await upsertRiskOutput(supabase, candidateId, employerId ?? null, NEUTRAL_SCORE, {});
    } catch (e2) {
      safeLog("upsertRiskOutput fallback", e2);
    }
    return null;
  }
}

async function upsertRiskOutput(
  supabase: any,
  candidateId: string,
  employerId: string | null,
  overallScore: number,
  breakdown: Record<string, number>
): Promise<void> {
  const row = {
    candidate_id: candidateId,
    employer_id: employerId,
    model_version: MODEL_VERSION,
    overall_score: overallScore,
    breakdown: breakdown as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  };
  const q = supabase
    .from("risk_model_outputs")
    .select("id")
    .eq("candidate_id", candidateId);
  const { data: existing } = employerId == null
    ? await q.is("employer_id", null).maybeSingle()
    : await q.eq("employer_id", employerId).maybeSingle();
  if (existing?.id) {
    await supabase.from("risk_model_outputs").update(row).eq("id", existing.id);
  } else {
    await supabase.from("risk_model_outputs").insert({
      candidate_id: candidateId,
      employer_id: employerId,
      model_version: MODEL_VERSION,
      overall_score: overallScore,
      breakdown: breakdown as unknown as Record<string, unknown>,
    });
  }
}
