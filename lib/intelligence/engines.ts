/**
 * Enterprise intelligence engines — industry-normalized scoring.
 * Silent calculation only; never throw; fail gracefully; log server-side only.
 * Do NOT expose to UI. All writes via service role.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateAndStoreRisk } from "@/lib/risk/calculateAndPersist";
import { calculateEmployerWorkforceRisk as workforceRisk } from "@/lib/risk/workforce";
import { calculateNetworkDensity } from "./networkMetrics";
import { getIndustryBaseline, safeRatio } from "./baselines";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));
const safeNum = (n: unknown, fallback: number): number => (Number.isFinite(Number(n)) ? Number(n) : fallback);

/** Resolve industry key from profile (industry_key or industry enum). Default "corporate". */
function profileIndustryKey(industryKey: string | null | undefined, industryEnum: string | null | undefined): string {
  const key = (industryKey && String(industryKey).trim()) || "";
  if (key) return key.toLowerCase();
  const e = (industryEnum && String(industryEnum).trim()) || "";
  if (!e) return "corporate";
  const map: Record<string, string> = { security: "security", healthcare: "healthcare", warehousing: "logistics", retail: "retail", construction: "construction", hospitality: "hospitality", technology: "technology", corporate: "corporate", logistics: "logistics", law_enforcement: "security" };
  return map[e.toLowerCase()] || "corporate";
}

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[intelligence:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

/**
 * Compute trust score (raw + industry-normalized), store in profiles.
 */
export async function calculateTrustScore(profileId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: profile } = await supabase.from("profiles").select("industry_key, industry").eq("id", profileId).maybeSingle();
    const industryKey = profileIndustryKey((profile as any)?.industry_key, (profile as any)?.industry);
    const baseline = await getIndustryBaseline(industryKey);

    let raw = 0;
    const { data: tsRow } = await supabase
      .from("trust_scores")
      .select("score")
      .eq("user_id", profileId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const score = (tsRow as { score?: number } | null)?.score;
    if (score != null && !Number.isNaN(score)) raw = clamp(score);
    else {
      const { data: jobs } = await supabase.from("jobs").select("id").eq("user_id", profileId);
      const jobIds = ((jobs ?? []) as { id: string }[]).map((j) => j.id);
      let approved = 0;
      if (jobIds.length > 0) {
        const { count } = await supabase.from("verification_requests").select("*", { count: "exact", head: true }).in("job_id", jobIds).eq("status", "approved");
        approved = count ?? 0;
      }
      const refCount = ((await supabase.from("references").select("id", { count: "exact", head: true }).eq("to_user_id", profileId)).count) ?? 0;
      const refRate = jobIds.length > 0 ? approved / jobIds.length : 0;
      raw = clamp((refRate * 50) + Math.min(refCount * 5, 50));
    }

    const candidateRefRate = raw / 100;
    const industryRef = baseline.avg_reference_response_rate || 0.5;
    const ratio = safeRatio(candidateRefRate, industryRef, 1);
    const norm = clamp(ratio * 50 * baseline.risk_weight + Math.min(50, raw));
    await supabase.from("profiles").update({ trust_score: raw, raw_trust_score: raw, normalized_trust_score: norm }).eq("id", profileId);
  } catch (e) {
    safeLog("calculateTrustScore", e);
  }
}

/**
 * Career stability (raw + industry-normalized): tenure, gap, reference response rate.
 */
export async function calculateCareerStability(profileId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: profile } = await supabase.from("profiles").select("industry_key, industry").eq("id", profileId).maybeSingle();
    const industryKey = profileIndustryKey((profile as any)?.industry_key, (profile as any)?.industry);
    const baseline = await getIndustryBaseline(industryKey);

    const { data: jobs } = await supabase.from("jobs").select("start_date, end_date").eq("user_id", profileId);
    const list = (jobs ?? []) as { start_date: string; end_date: string | null }[];
    let totalMonths = 0;
    for (const j of list) {
      const s = new Date(j.start_date).getTime();
      const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
      if (e > s) totalMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const jobCount = list.length;
    const { count: refCount } = await supabase.from("references").select("id", { count: "exact", head: true }).eq("to_user_id", profileId);
    const refResponseRate = jobCount > 0 ? (refCount ?? 0) / jobCount : 0;
    const gapMonths = 0;

    const raw = clamp(Math.min(100, (totalMonths / 24) * 100));
    const avgTenure = baseline.avg_tenure_months || 24;
    const avgGap = baseline.avg_gap_months || 3;
    const avgRef = baseline.avg_reference_response_rate || 0.5;
    const tenurePart = safeRatio(totalMonths, avgTenure, 1) * 50;
    const gapPart = safeRatio(gapMonths, avgGap, 0) * 20;
    const refPart = safeRatio(refResponseRate, avgRef, 1) * 30;
    const normalized = clamp((tenurePart - gapPart + refPart) * baseline.risk_weight);

    await supabase.from("profiles").update({ career_stability_score: raw, raw_stability_score: raw, normalized_stability_score: normalized }).eq("id", profileId);
  } catch (e) {
    safeLog("calculateCareerStability", e);
  }
}

/**
 * Network density from references, store in profiles.network_density_score (0–100).
 */
export async function calculateNetworkDensityScore(profileId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: refs } = await supabase.from("references").select("id, from_user_id, to_user_id, created_at").eq("to_user_id", profileId);
    const refList = (refs ?? []) as { from_user_id: string; created_at?: string }[];
    const { data: jobs } = await supabase.from("jobs").select("id").eq("user_id", profileId);
    const jobCount = Array.isArray(jobs) ? jobs.length : 0;
    const totalPossible = Math.max(jobCount * 2, 1);
    const density = calculateNetworkDensity({
      userId: profileId,
      references: refList.map((r) => ({ fromUserId: r.from_user_id, toUserId: profileId, respondedAt: r.created_at })),
      totalPossibleReferences: totalPossible,
    });
    const score = clamp(density * 100);
    await supabase.from("profiles").update({ network_density_score: score }).eq("id", profileId);
  } catch (e) {
    safeLog("calculateNetworkDensityScore", e);
  }
}

/**
 * Rehire probability (industry-normalized): rehire_registry + tenure vs industry baseline.
 */
export async function calculateRehireProbability(profileId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: profile } = await supabase.from("profiles").select("industry_key, industry").eq("id", profileId).maybeSingle();
    const industryKey = profileIndustryKey((profile as any)?.industry_key, (profile as any)?.industry);
    const baseline = await getIndustryBaseline(industryKey);

    const { data: rehireRows } = await supabase.from("rehire_registry").select("rehire_eligible").eq("profile_id", profileId);
    const rehireEligible = ((rehireRows ?? []) as { rehire_eligible: boolean }[]).some((r) => r.rehire_eligible);
    const { data: jobs } = await supabase.from("jobs").select("start_date, end_date").eq("user_id", profileId);
    const list = (jobs ?? []) as { start_date: string; end_date: string | null }[];
    let totalMonths = 0;
    for (const j of list) {
      const s = new Date(j.start_date).getTime();
      const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
      if (e > s) totalMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    let raw = 50;
    if (rehireEligible) raw += 25;
    raw += Math.min(20, list.length * 5);
    raw += Math.min(15, Math.floor(totalMonths / 12));
    raw = clamp(raw);
    const candidateRehireRate = raw / 100;
    const industryRehire = baseline.avg_rehire_rate || 0.5;
    const normalized = clamp(safeRatio(candidateRehireRate, industryRehire, 1) * 50 * baseline.risk_weight + 50 * Math.min(1, candidateRehireRate));
    await supabase.from("profiles").update({ rehire_probability_score: normalized }).eq("id", profileId);
  } catch (e) {
    safeLog("calculateRehireProbability", e);
  }
}

/**
 * Risk snapshot: delegate to existing risk engine, persist to profiles.risk_snapshot.
 */
export async function calculateRiskSnapshotForProfile(profileId: string): Promise<void> {
  try {
    await calculateAndStoreRisk(profileId);
  } catch (e) {
    safeLog("calculateRiskSnapshotForProfile", e);
  }
}

/**
 * Employer workforce risk (raw + industry-normalized): delegate to workforce module; then store raw + normalized.
 */
export async function calculateEmployerWorkforceRisk(employerId: string): Promise<void> {
  try {
    await workforceRisk(employerId);
    const supabase = getSupabaseServer() as any;
    const { data: ea } = await supabase.from("employer_accounts").select("workforce_risk_average, industry_key, industry").eq("id", employerId).single();
    const row = ea as { workforce_risk_average?: number; industry_key?: string; industry?: string } | null;
    const raw = row?.workforce_risk_average != null && Number.isFinite(row.workforce_risk_average) ? clamp(row.workforce_risk_average) : 0;
    const industryKey = profileIndustryKey(row?.industry_key, row?.industry);
    const baseline = await getIndustryBaseline(industryKey);
    const normalized = clamp(raw * baseline.risk_weight);

    const { count: vrCount } = await supabase
      .from("verification_requests")
      .select("*", { count: "exact", head: true })
      .eq("requested_by_id", employerId);
    const velocity = clamp(Math.min(100, (vrCount ?? 0) * 2));
    const { count: rehireCount } = await supabase.from("rehire_registry").select("*", { count: "exact", head: true }).eq("employer_id", employerId);
    const density = clamp(Math.min(100, (rehireCount ?? 0) * 5));
    await supabase
      .from("employer_accounts")
      .update({
        workforce_risk_index: raw,
        verification_velocity_score: velocity,
        rehire_density_score: density,
        raw_workforce_risk: raw,
        normalized_workforce_risk: normalized,
      })
      .eq("id", employerId);
  } catch (e) {
    safeLog("calculateEmployerWorkforceRisk", e);
  }
}

/**
 * Run all profile-level engines for a user (trust, career stability, network density, rehire, risk).
 * Call after verification report created, reference submitted, dispute resolved, credential uploaded.
 * Then upsert profile_metrics for silent employer overlay / analytics.
 */
export async function triggerProfileIntelligence(profileId: string): Promise<void> {
  await Promise.all([
    calculateTrustScore(profileId),
    calculateCareerStability(profileId),
    calculateNetworkDensityScore(profileId),
    calculateRehireProbability(profileId),
    calculateRiskSnapshotForProfile(profileId),
  ]).catch((e) => safeLog("triggerProfileIntelligence", e));
  const { upsertProfileMetrics } = await import("@/lib/profile-metrics");
  await upsertProfileMetrics(profileId).catch((e) => safeLog("upsertProfileMetrics", e));
  // Enterprise intelligence pipeline (team_fit_scores, risk_model_outputs, network_density_index, hiring_confidence_scores)
  const { runCandidateIntelligence } = await import("./runIntelligencePipeline");
  runCandidateIntelligence(profileId).catch((e) => safeLog("runCandidateIntelligence", e));
}

/**
 * Run employer-level workforce risk and indices.
 * Call after employer runs verification or bulk update.
 */
export async function triggerEmployerIntelligence(employerId: string): Promise<void> {
  await calculateEmployerWorkforceRisk(employerId).catch((e) => safeLog("triggerEmployerIntelligence", e));
}
