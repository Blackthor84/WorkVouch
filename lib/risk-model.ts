/**
 * Enterprise risk model. Server-side only.
 * Accepts candidateId and optional employerId; computes risk; persists to risk_model_outputs.
 * Never exposes to employees. Fail gracefully; neutral score if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateRiskSnapshot, type RiskSnapshotInput } from "@/lib/intelligence/riskEngine";
import { getBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import { getHybridBehavioralBaseline, getIndustryBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import { resolveIndustryKey } from "@/lib/industry-normalization";

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
    let coreOverall = clamp(snapshot.overallRiskScore);
    const breakdown: Record<string, number> = {
      tenureStabilityScore: snapshot.tenureStabilityScore,
      referenceResponseRate: snapshot.referenceResponseRate,
      rehireLikelihoodIndex: snapshot.rehireLikelihoodIndex,
      employmentGapScore: snapshot.employmentGapScore,
      disputeRiskScore: snapshot.disputeRiskScore,
    };

    const behavioralVector = await getBehavioralVector(candidateId).catch(() => null);
    if (behavioralVector) {
      let behavioralRiskScore: number;
      const candidateIndustry = await supabase
        .from("profiles")
        .select("industry, industry_key")
        .eq("id", candidateId)
        .maybeSingle()
        .then((r) => {
          const p = r.data as { industry?: string; industry_key?: string } | null;
          return resolveIndustryKey(p?.industry_key, p?.industry);
        })
        .catch(() => "corporate");
      const baseline = employerId
        ? await getHybridBehavioralBaseline(candidateIndustry, employerId)
        : await getIndustryBehavioralBaseline(candidateIndustry).then((b) => b ?? null);
      if (baseline) {
        const conflict = behavioralVector.conflict_risk_level ?? 0;
        const reliability = behavioralVector.avg_reliability ?? 0;
        const toneStability = behavioralVector.tone_stability ?? 0;
        const baseConflict = baseline.avg_conflict_risk ?? 50;
        const baseRel = baseline.avg_reliability ?? 50;
        const baseTone = baseline.avg_tone_stability ?? 50;
        let deviation = 0;
        if (conflict > baseConflict) deviation += Math.min(33, (conflict - baseConflict) / 2);
        if (reliability < baseRel) deviation += Math.min(33, (baseRel - reliability) / 2);
        if (toneStability < baseTone) deviation += Math.min(33, (baseTone - toneStability) / 2);
        behavioralRiskScore = clamp(50 + deviation);
      } else {
        const conflict = behavioralVector.conflict_risk_level ?? 0;
        const reliability = behavioralVector.avg_reliability ?? 0;
        const toneStability = behavioralVector.tone_stability ?? 0;
        behavioralRiskScore = clamp(
          (Number(conflict) + (100 - Number(reliability)) + (100 - Number(toneStability))) / 3
        );
      }
      breakdown.behavioralRiskScore = behavioralRiskScore;
      coreOverall = clamp(coreOverall * 0.85 + behavioralRiskScore * 0.15);
    }

    const overallScore = coreOverall;
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
