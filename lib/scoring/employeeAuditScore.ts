/**
 * Employee Audit Score — 100-point explainable model (server-side only).
 * Categories: Identity (10), Work history (20), Reference strength (30), Skill credibility (20), Risk (0 to -20).
 * Stored in employee_audit_scores. Do not replace or weaken trust_score / plan enforcement.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type AuditBand = "highly_verified" | "verified" | "partially_verified" | "unverified";

export interface EmployeeAuditBreakdown {
  identity: { score: number; max: number; details: string[] };
  workHistory: { score: number; max: number; details: string[] };
  referenceStrength: { score: number; max: number; details: string[] };
  skillCredibility: { score: number; max: number; details: string[] };
  risk: { score: number; min: number; details: string[] };
}

export interface EmployeeAuditResult {
  score: number;
  band: AuditBand;
  breakdown: EmployeeAuditBreakdown;
  calculatedAt: string;
}

const BAND_THRESHOLDS: { min: number; band: AuditBand }[] = [
  { min: 85, band: "highly_verified" },
  { min: 70, band: "verified" },
  { min: 55, band: "partially_verified" },
  { min: 0, band: "unverified" },
];

function bandFromScore(score: number): AuditBand {
  const s = Math.round(score);
  for (const { min, band } of BAND_THRESHOLDS) {
    if (s >= min) return band;
  }
  return "unverified";
}

/** Employer-facing short label (no numeric breakdown). */
export function getAuditLabel(band: AuditBand): string {
  switch (band) {
    case "highly_verified":
      return "Highly Verified";
    case "verified":
      return "Verified";
    case "partially_verified":
      return "Partially Verified";
    default:
      return "Unverified";
  }
}

/** Short explanation for employer (no admin detail). */
export function getAuditExplanation(band: AuditBand, breakdown: EmployeeAuditBreakdown): string {
  const low = [breakdown.identity, breakdown.workHistory, breakdown.referenceStrength, breakdown.skillCredibility].filter(
    (c) => c.score < c.max * 0.6
  );
  if (low.length === 0 && breakdown.risk.score >= 0) return "Profile, work history, and references meet verification standards.";
  const parts: string[] = [];
  if (breakdown.identity.score < 10) parts.push("identity verification");
  if (breakdown.workHistory.score < 12) parts.push("work history consistency");
  if (breakdown.referenceStrength.score < 18) parts.push("reference strength");
  if (breakdown.skillCredibility.score < 12) parts.push("skill credibility");
  if (breakdown.risk.score < 0) parts.push("risk signals");
  if (parts.length === 0) return "Profile, work history, and references meet verification standards.";
  return "Consider additional verification for: " + parts.join(", ") + ".";
}

export async function calculateEmployeeAuditScore(userId: string): Promise<EmployeeAuditResult> {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();

  const [profileRes, jobsRes, refsRes, skillsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email_verified, flagged_for_fraud").eq("id", userId).maybeSingle(),
    supabase.from("jobs").select("id, start_date, end_date, company_name, verification_status, supervisor_name").eq("user_id", userId).order("start_date", { ascending: true }),
    supabase.from("user_references").select("id, from_user_id, job_id, relationship_type, written_feedback").eq("to_user_id", userId).eq("is_deleted", false),
    (supabase as any).from("skills").select("skill_name").eq("user_id", userId).then((r: { data: unknown }) => r).catch(() => ({ data: [] })),
  ]);

  const profile = profileRes.data as { full_name?: string; email_verified?: boolean; flagged_for_fraud?: boolean } | null;
  const jobs = (jobsRes.data ?? []) as unknown as { id: string; start_date: string; end_date: string | null; company_name: string; verification_status?: string | null; supervisor_name?: string | null }[];
  const refs = (refsRes.data ?? []) as { id: string; from_user_id: string; job_id: string; relationship_type: string; written_feedback: string | null }[];
  const skills = (skillsRes as { data: unknown }).data as { skill_name: string }[] | null;
  const skillList = Array.isArray(skills) ? skills.map((s) => (s as { skill_name: string }).skill_name) : [];

  // —— A) Identity & Profile Integrity (10 pts) ——
  const emailVerified = (profile as any)?.email_verified !== false;
  const noFraudFlag = (profile as any)?.flagged_for_fraud !== true;
  const hasConsistentName = Boolean(profile?.full_name?.trim());
  let identityScore = 0;
  const identityDetails: string[] = [];
  if (emailVerified) {
    identityScore += 4;
    identityDetails.push("Verified email");
  } else identityDetails.push("Email not verified");
  if (hasConsistentName) {
    identityScore += 3;
    identityDetails.push("Name on file");
  }
  if (noFraudFlag) {
    identityScore += 3;
    identityDetails.push("No conflicting identity signals");
  } else identityDetails.push("Identity flags present");

  // —— B) Work History Consistency (20 pts) ——
  let workScore = 0;
  const workDetails: string[] = [];
  const sixMonthsMs = 6 * 30.44 * 24 * 60 * 60 * 1000;
  let gapsOver6Months = 0;
  let lastEnd: number | null = null;
  for (const j of jobs) {
    const start = new Date(j.start_date).getTime();
    if (lastEnd != null && start - lastEnd > sixMonthsMs) gapsOver6Months++;
    const end = j.end_date ? new Date(j.end_date).getTime() : Date.now();
    lastEnd = end;
  }
  if (gapsOver6Months === 0 && jobs.length > 0) {
    workScore += 7;
    workDetails.push("No unexplained gaps > 6 months");
  } else if (gapsOver6Months > 0) workDetails.push(`${gapsOver6Months} gap(s) > 6 months`);
  const jobsWithRef = new Set(refs.map((r) => r.job_id));
  const alignCount = jobs.filter((j) => jobsWithRef.has(j.id)).length;
  if (jobs.length > 0) {
    const alignRatio = alignCount / jobs.length;
    if (alignRatio >= 0.8) workScore += 7;
    else if (alignRatio >= 0.5) workScore += 4;
    workDetails.push(`Job durations align with references (${alignCount}/${jobs.length})`);
  } else workDetails.push("No job history");
  const chronological = jobs.length <= 1 || jobs.every((j, i) => i === 0 || new Date(j.start_date).getTime() >= new Date(jobs[i - 1].start_date).getTime());
  if (chronological) {
    workScore += 6;
    workDetails.push("Chronological consistency");
  }

  // —— C) Reference Strength (30 pts), cap 3 refs ——
  const refCap = 3;
  const refsUsed = refs.slice(0, refCap);
  let refScore = 0;
  const refDetails: string[] = [];
  const jobIdsToCompany = new Map(jobs.map((j) => [j.id, j.company_name]));
  const companiesInRefs = new Set(refsUsed.map((r) => jobIdsToCompany.get(r.job_id)).filter(Boolean));
  const supervisorTypes = new Set(["supervisor"]);
  for (let i = 0; i < refsUsed.length; i++) {
    const r = refsUsed[i];
    let pts = 10;
    if (supervisorTypes.has((r.relationship_type || "").toLowerCase())) pts = 12;
    refScore += Math.min(pts, 10);
    refDetails.push(`Reference ${i + 1} (${r.relationship_type || "peer"})`);
  }
  if (companiesInRefs.size > 1) {
    refScore = Math.min(30, refScore + 2 * (companiesInRefs.size - 1));
    refDetails.push("Cross-company references");
  }
  refScore = Math.min(30, refScore);

  // —— D) Skill Credibility (20 pts) ——
  let skillScore = 0;
  const skillDetails: string[] = [];
  if (skillList.length > 0) skillDetails.push(`${skillList.length} skill(s) listed`);
  const safetyWords = ["safety", "compliance", "certified", "license", "OSHA", "training"];
  const feedbackText = refs.map((r) => (r.written_feedback || "").toLowerCase()).join(" ");
  const safetyMentions = safetyWords.filter((w) => feedbackText.includes(w)).length;
  if (safetyMentions > 0) {
    skillScore += 7;
    skillDetails.push("Safety/compliance mentioned in references");
  }
  if (skillList.length >= 2) {
    skillScore += 7;
    skillDetails.push("Skills aligned with profile");
  } else if (skillList.length === 1) skillScore += 4;
  skillScore += Math.min(6, skillList.length * 2);
  skillScore = Math.min(20, skillScore);

  // —— E) Risk & Abuse Signals (−20 → 0 pts) ——
  const fromUserCounts = new Map<string, number>();
  for (const r of refs) {
    fromUserCounts.set(r.from_user_id, (fromUserCounts.get(r.from_user_id) ?? 0) + 1);
  }
  const reuseCount = [...fromUserCounts.values()].filter((c) => c > 1).length;
  let riskDeduction = Math.min(20, reuseCount * 7);
  const riskDetails: string[] = [];
  if (reuseCount > 0) riskDetails.push("Reference reuse (same referee multiple times)");
  const riskScore = Math.max(-20, -riskDeduction);

  const total = Math.max(0, Math.min(100, identityScore + workScore + refScore + skillScore + riskScore));
  const band = bandFromScore(total);

  const breakdown: EmployeeAuditBreakdown = {
    identity: { score: identityScore, max: 10, details: identityDetails },
    workHistory: { score: workScore, max: 20, details: workDetails },
    referenceStrength: { score: refScore, max: 30, details: refDetails },
    skillCredibility: { score: skillScore, max: 20, details: skillDetails },
    risk: { score: riskScore, min: -20, details: riskDetails },
  };

  return { score: total, band, breakdown, calculatedAt: now };
}

/** Persist score + breakdown to employee_audit_scores (upsert by user_id). */
export async function persistEmployeeAuditScore(userId: string, result: EmployeeAuditResult): Promise<{ error?: string }> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("employee_audit_scores").upsert(
    {
      user_id: userId,
      score: result.score,
      band: result.band,
      breakdown: result.breakdown as unknown as Record<string, unknown>,
      calculated_at: result.calculatedAt,
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: error.message };
  return {};
}

/** Calculate and persist in one call. */
export async function calculateAndPersistEmployeeAuditScore(userId: string): Promise<{ result?: EmployeeAuditResult; error?: string }> {
  const result = await calculateEmployeeAuditScore(userId);
  const persistResult = await persistEmployeeAuditScore(userId, result);
  if (persistResult.error) return { error: persistResult.error };
  return { result };
}

/** Fetch stored score for a user (returns null if not yet calculated). */
export async function getEmployeeAuditScore(userId: string): Promise<EmployeeAuditResult | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from("employee_audit_scores").select("score, band, breakdown, calculated_at").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return {
    score: data.score,
    band: data.band as AuditBand,
    breakdown: data.breakdown as unknown as EmployeeAuditBreakdown,
    calculatedAt: data.calculated_at,
  };
}

const BAND_ORDER: Record<AuditBand, number> = {
  highly_verified: 4,
  verified: 3,
  partially_verified: 2,
  unverified: 1,
};

/** Batch fetch stored audit scores; returns Map<userId, result>. */
export async function getEmployeeAuditScoresBatch(userIds: string[]): Promise<Map<string, EmployeeAuditResult>> {
  if (userIds.length === 0) return new Map();
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("employee_audit_scores")
    .select("user_id, score, band, breakdown, calculated_at")
    .in("user_id", [...new Set(userIds)]);
  if (error) return new Map();
  const map = new Map<string, EmployeeAuditResult>();
  for (const row of data ?? []) {
    const r = row as { user_id: string; score: number; band: string; breakdown: unknown; calculated_at: string };
    map.set(r.user_id, {
      score: r.score,
      band: r.band as AuditBand,
      breakdown: r.breakdown as unknown as EmployeeAuditBreakdown,
      calculatedAt: r.calculated_at,
    });
  }
  return map;
}

/** Compare for sort: band (desc), then score (desc), then calculatedAt (desc). */
export function compareAuditForRank(a: EmployeeAuditResult | null, b: EmployeeAuditResult | null): number {
  const bandOrderA = a ? BAND_ORDER[a.band] ?? 0 : 0;
  const bandOrderB = b ? BAND_ORDER[b.band] ?? 0 : 0;
  if (bandOrderB !== bandOrderA) return bandOrderB - bandOrderA;
  const scoreA = a?.score ?? -1;
  const scoreB = b?.score ?? -1;
  if (scoreB !== scoreA) return scoreB - scoreA;
  const atA = a?.calculatedAt ?? "";
  const atB = b?.calculatedAt ?? "";
  return atB.localeCompare(atA);
}
