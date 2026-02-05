/**
 * Sandbox V2 Template Engine — one-click population from preset profiles.
 * Uses only sandbox_* tables. Respects sandbox_feature_registry / sandbox_feature_overrides.
 * Pulls scoring fields dynamically via runEnterpriseEngine (future-proof).
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { runEnterpriseEngine } from "@/lib/sandbox/enterpriseEngine";
import { generateEmployeeIdentities } from "@/lib/sandbox/generators/identityGenerator";

const sb = () => getSupabaseServer() as any;

/** Rating distribution: probability per star 1–5. Should sum to 1. */
export type RatingDistribution = { 1: number; 2: number; 3: number; 4: number; 5: number };

/** Ad spend profile for simulation. */
export type AdSpendProfile = { spend: number; impressions: number; clicks: number; roiMin: number; roiMax: number };

export type TemplateProfile = {
  averageTenureMonths: number;
  tenureVariance: number;
  disputeRate: number;
  rehireProbability: number;
  peerReviewDensity: number; // reviews per employee (e.g. 220/85)
  ratingDistribution: RatingDistribution;
  sentimentBias: number; // 0–1, >0.5 positive
  departmentSpread: string[];
  adSpendProfile: AdSpendProfile;
  planValue: number;
  churnRate: number;
  companyName: string;
  industry: string;
};

const POSITIVE_PHRASES = ["Excellent team player", "Reliable and professional", "Strong performer", "Recommend highly", "Great communicator"];
const NEGATIVE_PHRASES = ["Some concerns", "Needs improvement", "Inconsistent at times"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickRating(dist: RatingDistribution): number {
  const r = Math.random();
  let acc = 0;
  for (let star = 1; star <= 5; star++) {
    acc += dist[star as keyof RatingDistribution];
    if (r <= acc) return star;
  }
  return 5;
}

function sampleTenure(avg: number, variance: number): number {
  const spread = avg * (variance / 100);
  const v = avg + (Math.random() * 2 - 1) * spread;
  return Math.max(1, Math.round(v));
}

/** Refresh sandbox_session_summary from current intel/revenue/ads (future-proof: pull fields dynamically). */
export async function refreshSessionSummary(sandboxId: string, dataDensityIndexOverride?: number): Promise<void> {
  const supabase = sb();
  const { data: intel } = await supabase
    .from("sandbox_intelligence_outputs")
    .select("profile_strength, career_health, risk_index, hiring_confidence, network_density")
    .eq("sandbox_id", sandboxId);
  const outputs = (intel ?? []) as { profile_strength?: number; career_health?: number; risk_index?: number; hiring_confidence?: number; network_density?: number }[];
  const n = outputs.length;
  const avg_profile_strength = n > 0 ? outputs.reduce((s, r) => s + (r.profile_strength ?? 0), 0) / n : null;
  const avg_career_health = n > 0 ? outputs.reduce((s, r) => s + (r.career_health ?? 0), 0) / n : null;
  const avg_risk_index = n > 0 ? outputs.reduce((s, r) => s + (r.risk_index ?? 0), 0) / n : null;
  const hiring_confidence_mean = n > 0 ? outputs.reduce((s, r) => s + (r.hiring_confidence ?? 0), 0) / n : null;
  const network_density = n > 0 ? outputs.reduce((s, r) => s + (r.network_density ?? 0), 0) / n : null;

  const { data: revRow } = await supabase.from("sandbox_revenue").select("mrr").eq("sandbox_id", sandboxId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const revenue_projection = revRow?.mrr ?? 0;
  const { data: adsRows } = await supabase.from("sandbox_ads").select("spend, clicks").eq("sandbox_id", sandboxId);
  const totalSpend = (adsRows ?? []).reduce((s: number, r: { spend?: number }) => s + Number(r.spend ?? 0), 0);
  const totalClicks = (adsRows ?? []).reduce((s: number, r: { clicks?: number }) => s + Number(r.clicks ?? 0), 0);
  const ad_roi = totalSpend > 0 && totalClicks > 0 ? (totalClicks * 150 - totalSpend) / totalSpend : 0;

  let data_density_index: number;
  if (dataDensityIndexOverride != null) {
    data_density_index = dataDensityIndexOverride;
  } else {
    const [empRes, recRes, revRes] = await Promise.all([
      supabase.from("sandbox_employees").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
      supabase.from("sandbox_employment_records").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
      supabase.from("sandbox_peer_reviews").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
    ]);
    const ec = (empRes as { count?: number }).count ?? 0;
    const rc = (recRes as { count?: number }).count ?? 0;
    const rvc = (revRes as { count?: number }).count ?? 0;
    data_density_index = ec + rc + rvc;
  }

  await supabase.from("sandbox_session_summary").upsert(
    {
      sandbox_id: sandboxId,
      avg_profile_strength,
      avg_career_health,
      avg_risk_index,
      hiring_confidence_mean,
      network_density,
      revenue_projection,
      ad_roi,
      data_density_index,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sandbox_id" }
  );
}

/** Run a template: create employer, employees, records, reviews, engine, revenue, ads, summary. */
export async function runTemplate(
  sandboxId: string,
  profile: TemplateProfile,
  employeeCount: number
): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const supabase = sb();
  const targetReviews = Math.max(employeeCount, Math.round(profile.peerReviewDensity * employeeCount));

  // 1. Create employer
  const { data: employer, error: empErr } = await supabase
    .from("sandbox_employers")
    .insert({
      sandbox_id: sandboxId,
      company_name: profile.companyName,
      industry: profile.industry,
      plan_tier: "enterprise",
    })
    .select("id")
    .single();
  if (empErr || !employer) return { ok: false, error: empErr?.message ?? "Failed to create employer" };

  const employerId = employer.id as string;

  // 2. Generate identities (industry-specific names, departments, job titles; no duplicate names)
  const usedFullNames = new Set<string>();
  const identities = generateEmployeeIdentities(
    employeeCount,
    { industry: profile.industry, sandboxId },
    usedFullNames
  );

  const employeeRows = identities.map((id) => ({
    sandbox_id: sandboxId,
    full_name: id.fullName,
    industry: id.industry,
  }));
  const { data: insertedEmployees, error: employeesErr } = await supabase
    .from("sandbox_employees")
    .insert(employeeRows)
    .select("id");
  if (employeesErr || !insertedEmployees?.length) return { ok: false, error: employeesErr?.message ?? "Failed to create employees" };

  const employeeIds = insertedEmployees.map((e: { id: string }) => e.id) as string[];

  // 3. Employment records: each employee -> employer, role = jobTitle, tenure/rehire from profile
  const records = employeeIds.map((employee_id, idx) => ({
    sandbox_id: sandboxId,
    employee_id,
    employer_id: employerId,
    role: identities[idx]!.jobTitle,
    tenure_months: sampleTenure(profile.averageTenureMonths, profile.tenureVariance),
    rehire_eligible: Math.random() < profile.rehireProbability,
  }));
  const { error: recordsErr } = await supabase.from("sandbox_employment_records").insert(records);
  if (recordsErr) return { ok: false, error: recordsErr.message };

  // 4. Peer reviews: targetReviews pairs (reviewer, reviewed), rating from distribution, sentiment from bias
  const reviewRows: { sandbox_id: string; reviewer_id: string; reviewed_id: string; rating: number; review_text: string | null; sentiment_score: number }[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetReviews * 4;
  while (reviewRows.length < targetReviews && attempts < maxAttempts) {
    attempts++;
    const reviewer_id = pick(employeeIds);
    const reviewed_id = pick(employeeIds);
    if (reviewer_id === reviewed_id) continue;
    const key = `${reviewer_id}-${reviewed_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rating = pickRating(profile.ratingDistribution);
    const usePositive = Math.random() < profile.sentimentBias;
    const review_text = usePositive ? pick(POSITIVE_PHRASES) : pick(NEGATIVE_PHRASES);
    const sentiment_score = usePositive ? 0.5 + Math.random() * 0.5 : Math.random() * 0.5;
    reviewRows.push({
      sandbox_id: sandboxId,
      reviewer_id,
      reviewed_id,
      rating,
      review_text,
      sentiment_score,
    });
  }
  if (reviewRows.length > 0) {
    const { error: reviewsErr } = await supabase.from("sandbox_peer_reviews").insert(reviewRows);
    if (reviewsErr) return { ok: false, error: reviewsErr.message };
  }

  // 5. Run enterprise intelligence engine (dynamic metrics)
  const engineResult = await runEnterpriseEngine(sandboxId);
  if (!engineResult.ok) return { ok: false, error: engineResult.error };

  // 6. Revenue: MRR = employer_count * planValue, churn from profile
  await supabase.from("sandbox_revenue").insert({
    sandbox_id: sandboxId,
    mrr: 1 * profile.planValue,
    churn_rate: profile.churnRate,
  });

  // 7. Ads: one campaign from adSpendProfile
  const ap = profile.adSpendProfile;
  const roi = ap.spend > 0 ? ap.roiMin + Math.random() * (ap.roiMax - ap.roiMin) : 0;
  const conversionValue = 150;
  const clicks = Math.round((ap.spend * (1 + roi)) / conversionValue);
  await supabase.from("sandbox_ads").insert({
    sandbox_id: sandboxId,
    employer_id: employerId,
    impressions: ap.impressions,
    clicks,
    spend: ap.spend,
    roi,
  });

  // 8. Compute and upsert session summary (pull metrics dynamically from intelligence_outputs)
  const data_density_index = employeeCount + records.length + reviewRows.length;
  await refreshSessionSummary(sandboxId, data_density_index);

  return {
    ok: true,
    stats: { employees: employeeCount, reviews: reviewRows.length, records: records.length },
  };
}

const SECURITY_AGENCY: TemplateProfile = {
  averageTenureMonths: 28,
  tenureVariance: 25,
  disputeRate: 0.08,
  rehireProbability: 0.72,
  peerReviewDensity: 220 / 85,
  ratingDistribution: { 1: 0.02, 2: 0.05, 3: 0.18, 4: 0.4, 5: 0.35 },
  sentimentBias: 0.7,
  departmentSpread: ["Operations", "Field", "Compliance", "HR"],
  adSpendProfile: { spend: 800, impressions: 12000, clicks: 180, roiMin: 2.2, roiMax: 3.5 },
  planValue: 99,
  churnRate: 0.04,
  companyName: "SecureGuard Mid Size",
  industry: "Security",
};

const HEALTHCARE_NETWORK: TemplateProfile = {
  averageTenureMonths: 60,
  tenureVariance: 20,
  disputeRate: 0.02,
  rehireProbability: 0.88,
  peerReviewDensity: 350 / 140,
  ratingDistribution: { 1: 0.01, 2: 0.02, 3: 0.12, 4: 0.4, 5: 0.45 },
  sentimentBias: 0.85,
  departmentSpread: ["Clinical", "Admin", "Support", "Compliance"],
  adSpendProfile: { spend: 1200, impressions: 20000, clicks: 320, roiMin: 2.8, roiMax: 4.0 },
  planValue: 199,
  churnRate: 0.015,
  companyName: "Regional Healthcare Network",
  industry: "Healthcare",
};

const TECH_STARTUP: TemplateProfile = {
  averageTenureMonths: 14,
  tenureVariance: 50,
  disputeRate: 0.15,
  rehireProbability: 0.55,
  peerReviewDensity: 300 / 60,
  ratingDistribution: { 1: 0.08, 2: 0.12, 3: 0.25, 4: 0.3, 5: 0.25 },
  sentimentBias: 0.5,
  departmentSpread: ["Engineering", "Product", "Growth", "Ops"],
  adSpendProfile: { spend: 2500, impressions: 40000, clicks: 600, roiMin: 1.8, roiMax: 3.2 },
  planValue: 149,
  churnRate: 0.08,
  companyName: "Series B Tech Startup",
  industry: "Technology",
};

const ENTERPRISE_CORP: TemplateProfile = {
  averageTenureMonths: 72,
  tenureVariance: 18,
  disputeRate: 0.05,
  rehireProbability: 0.82,
  peerReviewDensity: 800 / 300,
  ratingDistribution: { 1: 0.02, 2: 0.05, 3: 0.18, 4: 0.4, 5: 0.35 },
  sentimentBias: 0.78,
  departmentSpread: ["Finance", "Legal", "Engineering", "Sales", "HR", "Operations"],
  adSpendProfile: { spend: 8000, impressions: 120000, clicks: 2400, roiMin: 3.2, roiMax: 4.8 },
  planValue: 399,
  churnRate: 0.018,
  companyName: "Fortune 500 Enterprise",
  industry: "Corporate",
};

const LOGISTICS_GROUP: TemplateProfile = {
  averageTenureMonths: 36,
  tenureVariance: 35,
  disputeRate: 0.12,
  rehireProbability: 0.65,
  peerReviewDensity: 280 / 110,
  ratingDistribution: { 1: 0.04, 2: 0.1, 3: 0.22, 4: 0.36, 5: 0.28 },
  sentimentBias: 0.62,
  departmentSpread: ["Fleet", "Warehouse", "Regional", "Admin"],
  adSpendProfile: { spend: 1500, impressions: 25000, clicks: 380, roiMin: 2.4, roiMax: 3.6 },
  planValue: 99,
  churnRate: 0.05,
  companyName: "Logistics & Transportation Group",
  industry: "Logistics",
};

const HOSPITALITY_CHAIN: TemplateProfile = {
  averageTenureMonths: 18,
  tenureVariance: 55,
  disputeRate: 0.1,
  rehireProbability: 0.58,
  peerReviewDensity: 320 / 120,
  ratingDistribution: { 1: 0.06, 2: 0.1, 3: 0.24, 4: 0.35, 5: 0.25 },
  sentimentBias: 0.55,
  departmentSpread: ["Front Desk", "Housekeeping", "F&B", "Management"],
  adSpendProfile: { spend: 2000, impressions: 35000, clicks: 500, roiMin: 2.0, roiMax: 3.4 },
  planValue: 99,
  churnRate: 0.12,
  companyName: "Hospitality Brand Chain",
  industry: "Hospitality",
};

const TEMPLATE_MAP: Record<string, TemplateProfile> = {
  security_agency: SECURITY_AGENCY,
  healthcare_network: HEALTHCARE_NETWORK,
  tech_startup: TECH_STARTUP,
  enterprise_corp: ENTERPRISE_CORP,
  logistics_group: LOGISTICS_GROUP,
  hospitality_chain: HOSPITALITY_CHAIN,
};

export function getTemplateProfile(templateKey: string): TemplateProfile | null {
  return TEMPLATE_MAP[templateKey] ?? null;
}

export async function generateSecurityAgencyTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 85;
  return runTemplate(sandboxId, SECURITY_AGENCY, n);
}

export async function generateHealthcareTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 140;
  return runTemplate(sandboxId, HEALTHCARE_NETWORK, n);
}

export async function generateTechStartupTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 60;
  return runTemplate(sandboxId, TECH_STARTUP, n);
}

export async function generateEnterpriseTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 300;
  return runTemplate(sandboxId, ENTERPRISE_CORP, n);
}

export async function generateLogisticsTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 110;
  return runTemplate(sandboxId, LOGISTICS_GROUP, n);
}

export async function generateHospitalityTemplate(sandboxId: string, employeeCountOverride?: number): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const n = employeeCountOverride ?? 120;
  return runTemplate(sandboxId, HOSPITALITY_CHAIN, n);
}

/** Single entry: run template by key. */
export async function generateTemplateByKey(
  sandboxId: string,
  templateKey: string,
  employeeCountOverride?: number
): Promise<{ ok: boolean; error?: string; stats?: { employees: number; reviews: number; records: number } }> {
  const profile = getTemplateProfile(templateKey);
  if (!profile) return { ok: false, error: `Unknown template: ${templateKey}` };
  const defaultCount = templateKey === "enterprise_corp" ? 300 : templateKey === "healthcare_network" ? 140 : templateKey === "security_agency" ? 85 : templateKey === "tech_startup" ? 60 : templateKey === "logistics_group" ? 110 : 120;
  const n = employeeCountOverride ?? defaultCount;
  return runTemplate(sandboxId, profile, n);
}
