/**
 * Enterprise team fit engine. Server-side only.
 * Accepts candidateId and employerId; computes team baseline from verified employees; alignment score.
 * Persists to team_fit_scores. Never exposes to employees. Fail gracefully; neutral if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getIndustryBaseline } from "@/lib/intelligence/baselines";
import { resolveIndustryKey } from "@/lib/industry-normalization";

const MODEL_VERSION = "1";
const NEUTRAL_ALIGNMENT = 50;

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[team-fit-engine:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

async function getTeamBaseline(
  supabase: ReturnType<typeof getSupabaseServer>,
  employerId: string
): Promise<{
  avgTenureMonths: number;
  avgVerifiedCount: number;
  avgReferenceCount: number;
  industryKey: string;
  sampleSize: number;
}> {
  try {
    const { data: employer } = await supabase
      .from("employer_accounts")
      .select("industry_type, industry_key")
      .eq("id", employerId)
      .maybeSingle();
    const industryKey = resolveIndustryKey(
      (employer as { industry_key?: string } | null)?.industry_key,
      (employer as { industry_type?: string } | null)?.industry_type
    );
    const baseline = await getIndustryBaseline(industryKey);

    const { data: records } = await supabase
      .from("employment_records")
      .select("user_id, start_date, end_date")
      .eq("marked_by_employer_id", employerId)
      .in("verification_status", ["verified", "matched"]);
    const recs = (records ?? []) as { user_id: string; start_date?: string; end_date?: string | null }[];
    const uniqueUsers = [...new Set(recs.map((r) => r.user_id))];
    let totalTenureMonths = 0;
    for (const r of recs) {
      const s = r.start_date ? new Date(r.start_date).getTime() : 0;
      const e = r.end_date ? new Date(r.end_date).getTime() : Date.now();
      if (s > 0 && e >= s) totalTenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const avgTenureMonths = recs.length > 0 ? totalTenureMonths / recs.length : baseline.avg_tenure_months ?? 24;
    const avgVerifiedCount = uniqueUsers.length > 0 ? recs.length / uniqueUsers.length : 1;

    let totalRefs = 0;
    if (uniqueUsers.length > 0) {
      const { count } = await supabase
        .from("employment_references")
        .select("*", { count: "exact", head: true })
        .in("reviewed_user_id", uniqueUsers);
      totalRefs = count ?? 0;
    }
    const avgReferenceCount = uniqueUsers.length > 0 ? totalRefs / uniqueUsers.length : 0;

    return {
      avgTenureMonths,
      avgVerifiedCount,
      avgReferenceCount,
      industryKey,
      sampleSize: uniqueUsers.length,
    };
  } catch (e) {
    safeLog("getTeamBaseline", e);
    const baseline = await getIndustryBaseline("corporate");
    return {
      avgTenureMonths: baseline.avg_tenure_months ?? 24,
      avgVerifiedCount: 1,
      avgReferenceCount: 0,
      industryKey: "corporate",
      sampleSize: 0,
    };
  }
}

async function getCandidateMetrics(
  supabase: ReturnType<typeof getSupabaseServer>,
  candidateId: string
): Promise<{ tenureMonths: number; verifiedCount: number; referenceCount: number }> {
  try {
    const { data: records } = await supabase
      .from("employment_records")
      .select("id, start_date, end_date")
      .eq("user_id", candidateId)
      .in("verification_status", ["verified", "matched"]);
    const recs = (records ?? []) as { id: string; start_date?: string; end_date?: string | null }[];
    let tenureMonths = 0;
    for (const r of recs) {
      const s = r.start_date ? new Date(r.start_date).getTime() : 0;
      const e = r.end_date ? new Date(r.end_date).getTime() : Date.now();
      if (s > 0 && e >= s) tenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const { count: refCount } = await supabase
      .from("employment_references")
      .select("*", { count: "exact", head: true })
      .eq("reviewed_user_id", candidateId);
    return {
      tenureMonths,
      verifiedCount: recs.length,
      referenceCount: refCount ?? 0,
    };
  } catch (e) {
    safeLog("getCandidateMetrics", e);
    return { tenureMonths: 0, verifiedCount: 0, referenceCount: 0 };
  }
}

export async function computeAndPersistTeamFit(
  candidateId: string,
  employerId: string
): Promise<{ alignmentScore: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer() as any;
    const [baseline, candidate] = await Promise.all([
      getTeamBaseline(supabase, employerId),
      getCandidateMetrics(supabase, candidateId),
    ]);

    let alignment = NEUTRAL_ALIGNMENT;
    const tenureRatio = baseline.avgTenureMonths > 0
      ? Math.min(1.5, candidate.tenureMonths / baseline.avgTenureMonths)
      : 1;
    const verifiedRatio = baseline.avgVerifiedCount > 0
      ? Math.min(1.5, candidate.verifiedCount / baseline.avgVerifiedCount)
      : 1;
    const refRatio = baseline.avgReferenceCount > 0
      ? Math.min(1.5, candidate.referenceCount / baseline.avgReferenceCount)
      : candidate.referenceCount > 0 ? 1 : 0.5;
    alignment = clamp(
      NEUTRAL_ALIGNMENT +
        (tenureRatio - 1) * 15 +
        (verifiedRatio - 1) * 15 +
        (refRatio - 0.5) * 20
    );

    const breakdown = {
      teamAvgTenureMonths: baseline.avgTenureMonths,
      teamAvgVerifiedCount: baseline.avgVerifiedCount,
      teamAvgReferenceCount: baseline.avgReferenceCount,
      teamSampleSize: baseline.sampleSize,
      candidateTenureMonths: candidate.tenureMonths,
      candidateVerifiedCount: candidate.verifiedCount,
      candidateReferenceCount: candidate.referenceCount,
      tenureRatio,
      verifiedRatio,
      refRatio,
    };

    const row = {
      candidate_id: candidateId,
      employer_id: employerId,
      model_version: MODEL_VERSION,
      alignment_score: alignment,
      breakdown: breakdown as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };
    const { data: existing } = await supabase
      .from("team_fit_scores")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("employer_id", employerId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("team_fit_scores").update(row).eq("id", existing.id);
    } else {
      await supabase.from("team_fit_scores").insert({
        candidate_id: candidateId,
        employer_id: employerId,
        model_version: MODEL_VERSION,
        alignment_score: alignment,
        breakdown: breakdown as unknown as Record<string, unknown>,
      });
    }
    return { alignmentScore: alignment, breakdown };
  } catch (e) {
    safeLog("computeAndPersistTeamFit", e);
    return null;
  }
}
