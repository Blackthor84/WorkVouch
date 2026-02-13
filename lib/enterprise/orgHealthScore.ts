/**
 * Organization health scoring for admin clarity and 403 UX.
 * Uses existing: plan_limits, organization_usage, organization_metrics, getAbuseSignals.
 * Additive only; no duplicate enforcement.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrgPlanLimits } from "./orgPlanLimits";
import { getAbuseSignals, ENTERPRISE_RECOMMENDED_THRESHOLD, ABUSE_RISK_THRESHOLD } from "./abuseSignals";

export type OrgHealthStatus = "healthy" | "at_risk" | "misaligned";

export interface OrgHealthScoreResult {
  status: OrgHealthStatus;
  score: number;
  /** 0–100; higher = more pressure to upgrade */
  usagePercent: number | null;
  limitViolationsLast30Days: number;
  abuseScore: number;
  abuseFlags: string[];
  enterpriseRecommended: boolean;
  /** Human-readable summary */
  summary: string;
  recommended_plan: "enterprise" | null;
  /** 0–100 company health (higher = healthier); for dashboards */
  healthScore: number;
  /** Contributing factors (0–100 each, for improvement suggestions) */
  verifiedEmployeePct: number | null;
  referenceCompletionPct: number | null;
  adminToEmployeeRatioPct: number | null;
  locationVsPlanPct: number | null;
  /** Improvement suggestions for org admin */
  suggestions: string[];
}

function normalizePlanKey(planType: string | null | undefined): string {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "growth" || t === "professional" || t === "pro") return "growth";
  return "starter";
}

/**
 * Compute org health from plan usage %, limit blocks (30d), abuse signals, multi-location.
 * Used by: admin dashboards, org dashboard, 403 responses (additive; does not replace checkOrgLimits).
 */
export async function getOrgHealthScore(organizationId: string): Promise<OrgHealthScoreResult> {
  const supabase = getSupabaseServer();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan_type")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return {
      status: "healthy",
      score: 0,
      usagePercent: null,
      limitViolationsLast30Days: 0,
      abuseScore: 0,
      abuseFlags: [],
      enterpriseRecommended: false,
      summary: "Organization not found.",
      recommended_plan: null,
      healthScore: 0,
      verifiedEmployeePct: null,
      referenceCompletionPct: null,
      adminToEmployeeRatioPct: null,
      locationVsPlanPct: null,
      suggestions: [],
    };
  }

  const planType = (org as { plan_type?: string | null }).plan_type;
  const planKey = normalizePlanKey(planType);
  const limits = getOrgPlanLimits(planType);
  const abuse = await getAbuseSignals(organizationId);

  const month = new Date().toISOString().slice(0, 7);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [usageRow, blockRows, locCountRes, workforceRes, membersRes] = await Promise.all([
    supabase
      .from("organization_usage")
      .select("monthly_checks")
      .eq("organization_id", organizationId)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("organization_metrics")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("metric_name", "limit_block")
      .gte("created_at", since30d),
    planKey === "enterprise"
      ? Promise.resolve({ count: 0 })
      : supabase
          .from("locations")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId),
    supabase
      .from("workforce_employees")
      .select("profile_id")
      .eq("organization_id", organizationId),
    supabase
      .from("tenant_memberships")
      .select("id, role")
      .eq("organization_id", organizationId),
  ]);

  const monthlyChecks = (usageRow.data as { monthly_checks?: number } | null)?.monthly_checks ?? 0;
  const limitViolationsLast30Days = (blockRows.data ?? []).length;
  const maxChecks = limits.max_monthly_checks;
  const usagePercent =
    maxChecks != null && maxChecks >= 0 && maxChecks > 0
      ? Math.min(100, Math.round((monthlyChecks / maxChecks) * 100))
      : null;

  const locationCount = typeof (locCountRes as { count?: number })?.count === "number" ? (locCountRes as { count: number }).count : 0;

  const workforce = (workforceRes.data ?? []) as { profile_id: string | null }[];
  const profileIds = workforce.map((w) => w.profile_id).filter(Boolean) as string[];
  const employeeCount = profileIds.length;

  let verifiedCount = 0;
  if (profileIds.length > 0) {
    const { data: auditRows } = await supabase
      .from("employee_audit_scores")
      .select("user_id")
      .in("user_id", profileIds)
      .in("band", ["highly_verified", "verified"]);
    verifiedCount = new Set(((auditRows ?? []) as { user_id: string }[]).map((r) => r.user_id)).size;
  }
  const verifiedEmployeePct =
    employeeCount > 0 ? Math.round((verifiedCount / employeeCount) * 100) : null;

  let referenceCompletionPct: number | null = null;
  if (profileIds.length > 0) {
    const { data: refRows } = await supabase
      .from("references")
      .select("to_user_id")
      .eq("is_deleted", false)
      .in("to_user_id", profileIds);
    const withRefs = new Set(((refRows ?? []) as { to_user_id: string }[]).map((r) => r.to_user_id));
    referenceCompletionPct = Math.round((withRefs.size / profileIds.length) * 100);
  }

  const members = (membersRes.data ?? []) as { role: string }[];
  const adminRoles = new Set(["org_admin", "admin", "superadmin"]);
  const adminCount = members.filter((m) => adminRoles.has((m.role || "").toLowerCase())).length;
  const adminToEmployeeRatioPct =
    employeeCount > 0 ? Math.min(100, Math.round((adminCount / employeeCount) * 5000)) : 100;

  const locationVsPlanPct =
    planKey === "enterprise" || limits.max_locations < 0
      ? 100
      : limits.max_locations === 0
        ? (locationCount === 0 ? 100 : 0)
        : Math.max(0, Math.round(100 - (Math.max(0, locationCount - limits.max_locations) / limits.max_locations) * 100));

  let score = 0;
  if (usagePercent != null) {
    if (usagePercent >= 100) score += 40;
    else if (usagePercent >= 85) score += 25;
    else if (usagePercent >= 70) score += 10;
  }
  if (limitViolationsLast30Days > 0) {
    score += Math.min(30, limitViolationsLast30Days * 10);
  }
  if (abuse.riskScore >= ABUSE_RISK_THRESHOLD) score += 40;
  else if (abuse.riskScore >= ENTERPRISE_RECOMMENDED_THRESHOLD) score += 20;
  if (planKey !== "enterprise" && limits.max_locations >= 0 && locationCount > limits.max_locations) {
    score += 25;
  }

  const totalScore = Math.min(100, score);
  let status: OrgHealthStatus = "healthy";
  if (totalScore >= 50 || abuse.riskScore >= ABUSE_RISK_THRESHOLD) status = "misaligned";
  else if (totalScore >= 25 || limitViolationsLast30Days > 0 || (abuse.enterprise_recommended && abuse.riskScore >= ENTERPRISE_RECOMMENDED_THRESHOLD))
    status = "at_risk";

  let summary = "Usage and limits are within plan.";
  if (status === "at_risk") {
    summary = "Approaching or at plan limits; consider upgrading for headroom.";
  } else if (status === "misaligned") {
    summary = "Plan limits exceeded or high abuse risk. Enterprise recommended.";
  }

  const usageHeadroom = usagePercent != null ? 100 - usagePercent : 100;
  const abuseHeadroom = 100 - abuse.riskScore;
  const healthComponents = [
    abuseHeadroom,
    usageHeadroom,
    verifiedEmployeePct ?? 100,
    referenceCompletionPct ?? 100,
    adminToEmployeeRatioPct,
    locationVsPlanPct,
  ];
  const healthScore = Math.max(0, Math.min(100, Math.round(healthComponents.reduce((a, b) => a + b, 0) / healthComponents.length)));

  const suggestions: string[] = [];
  if ((verifiedEmployeePct ?? 100) < 80) suggestions.push("Increase share of verified employees.");
  if ((referenceCompletionPct ?? 100) < 70) suggestions.push("Improve reference completion for workforce.");
  if (abuse.riskScore >= ENTERPRISE_RECOMMENDED_THRESHOLD) suggestions.push("Reduce high-velocity or multi-geo signals; consider Enterprise.");
  if (usagePercent != null && usagePercent >= 85) suggestions.push("Monthly usage near plan limit; consider upgrading.");
  if (adminToEmployeeRatioPct < 20 && employeeCount > 10) suggestions.push("Consider adding org admins for scale.");
  if (locationVsPlanPct < 100) suggestions.push("Location count exceeds plan; upgrade for more locations.");

  const HEALTH_SCORE_ENTERPRISE_THRESHOLD = 50;
  const enterpriseRecommendedByHealth = healthScore < HEALTH_SCORE_ENTERPRISE_THRESHOLD;

  return {
    status,
    score: totalScore,
    usagePercent,
    limitViolationsLast30Days,
    abuseScore: abuse.riskScore,
    abuseFlags: abuse.flags,
    enterpriseRecommended: abuse.enterprise_recommended || enterpriseRecommendedByHealth,
    summary,
    recommended_plan: status === "misaligned" ? "enterprise" : status === "at_risk" ? "enterprise" : null,
    healthScore,
    verifiedEmployeePct: verifiedEmployeePct ?? null,
    referenceCompletionPct,
    adminToEmployeeRatioPct,
    locationVsPlanPct,
    suggestions,
  };
}

/**
 * Persist current org health score and contributing factors to organization_metrics.
 * Call from cron (nightly) and after major events (add location, add admin, limit block).
 */
export async function persistOrgHealthScore(organizationId: string): Promise<{ error?: string }> {
  const result = await getOrgHealthScore(organizationId);
  const supabase = getSupabaseServer();
  const values: { metric_name: string; metric_value: number }[] = [
    { metric_name: "org_health_score", metric_value: result.healthScore },
    { metric_name: "org_health_verified_pct", metric_value: result.verifiedEmployeePct ?? -1 },
    { metric_name: "org_health_reference_pct", metric_value: result.referenceCompletionPct ?? -1 },
    { metric_name: "org_health_abuse_penalty", metric_value: result.abuseScore },
    { metric_name: "org_health_usage_headroom", metric_value: result.usagePercent != null ? 100 - result.usagePercent : 100 },
    { metric_name: "org_health_admin_ratio_pct", metric_value: result.adminToEmployeeRatioPct ?? 0 },
    { metric_name: "org_health_location_pct", metric_value: result.locationVsPlanPct ?? 0 },
  ];
  for (const v of values) {
    const { error } = await supabase.from("organization_metrics").insert({
      organization_id: organizationId,
      metric_name: v.metric_name,
      metric_value: v.metric_value,
    });
    if (error) return { error: error.message };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Silent Org Health (organization_health table) — server/super_admin only.
// Not visible to orgs or users. Observational only; no blocking.
// TODO: Score-based search ranking (use band when ranking orgs/candidates).
// TODO: Enterprise-only visibility toggle (expose band to org admin later).
// TODO: Exportable compliance reports (include health band in admin export).
// TODO: Customer-facing explainer copy (later phase).
// ---------------------------------------------------------------------------

export type OrgHealthBand = "trusted" | "monitor" | "review";

export interface ComputeOrgHealthResult {
  score: number;
  band: OrgHealthBand;
  signals: Record<string, number | boolean>;
}

function normalizePlanKeyForHealth(planType: string | null | undefined): string {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "growth" || t === "professional" || t === "pro") return "growth";
  return "starter";
}

/**
 * Compute silent org health: start at 100, subtract penalties.
 * Used only server-side; never exposed to orgs or users.
 */
export async function computeOrgHealthScore(organizationId: string): Promise<ComputeOrgHealthResult> {
  const supabase = getSupabaseServer();
  const signals: Record<string, number | boolean> = {};
  let penalty = 0;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan_type")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return { score: 0, band: "review", signals: { org_not_found: true } };
  }

  const planType = (org as { plan_type?: string | null }).plan_type;
  const planKey = normalizePlanKeyForHealth(planType);
  const limits = getOrgPlanLimits(planType);
  const abuse = await getAbuseSignals(organizationId);

  const month = new Date().toISOString().slice(0, 7);
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [usageRow, limitBlockCountRes, locRes, locationsRes, membersRes] = await Promise.all([
    supabase
      .from("organization_usage")
      .select("monthly_checks, unlock_count")
      .eq("organization_id", organizationId)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("organization_metrics")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("metric_name", "limit_block")
      .gte("created_at", since30d),
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("locations")
      .select("id, city, state")
      .eq("organization_id", organizationId),
    supabase
      .from("tenant_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("role", ["org_admin", "admin", "superadmin"]),
  ]);

  const monthlyChecks = (usageRow.data as { monthly_checks?: number } | null)?.monthly_checks ?? 0;
  const unlockCount = (usageRow.data as { unlock_count?: number } | null)?.unlock_count ?? 0;
  const limitBlockCount = typeof (limitBlockCountRes as { count?: number })?.count === "number" ? (limitBlockCountRes as { count: number }).count : 0;
  const locationCount = typeof (locRes as { count?: number })?.count === "number" ? (locRes as { count: number }).count : 0;
  const adminCount = typeof (membersRes as { count?: number })?.count === "number" ? (membersRes as { count: number }).count : 0;
  const locations = (locationsRes.data ?? []) as { city: string | null; state: string | null }[];
  const distinctGeos = new Set(
    locations.map((l) => [l.city ?? "", l.state ?? ""].filter(Boolean).join("|")).filter(Boolean)
  ).size;

  // Excess locations vs plan
  if (planKey !== "enterprise" && limits.max_locations >= 0 && locationCount > limits.max_locations) {
    const excess = locationCount - limits.max_locations;
    const p = Math.min(15, excess * 5);
    penalty += p;
    signals.excess_locations_vs_plan = excess;
  }

  // Monthly check usage %
  if (limits.max_monthly_checks >= 0 && limits.max_monthly_checks > 0) {
    const usagePct = monthlyChecks / limits.max_monthly_checks;
    signals.monthly_check_usage_pct = Math.round(usagePct * 100);
    if (usagePct >= 1) penalty += 25;
    else if (usagePct >= 0.85) penalty += 12;
    else if (usagePct >= 0.7) penalty += 5;
  }

  // Abuse flags (from abuseSignals)
  signals.abuse_risk_score = abuse.riskScore;
  signals.abuse_flags_count = abuse.flags.length;
  if (abuse.riskScore >= ABUSE_RISK_THRESHOLD) penalty += 30;
  else if (abuse.riskScore >= ENTERPRISE_RECOMMENDED_THRESHOLD) penalty += 15;

  // High velocity (checks early in month / near limit)
  const dayOfMonth = new Date().getDate();
  if (limits.max_monthly_checks > 0 && monthlyChecks / limits.max_monthly_checks >= 0.5 && dayOfMonth <= 7) {
    penalty += 10;
    signals.high_velocity_checks = true;
  }

  // Admin churn proxy: very low admin count (0 or 1) for orgs with locations
  if (locationCount > 0 && adminCount <= 1) {
    penalty += 5;
    signals.low_admin_count = true;
  }

  // Failed enforcement attempts (limit_block in last 30d)
  if (limitBlockCount > 0) {
    const p = Math.min(20, limitBlockCount * 5);
    penalty += p;
    signals.limit_blocks_30d = limitBlockCount;
  }

  // Geo spread anomalies (multi-geo on starter / over cap)
  if (planKey === "starter" && distinctGeos > 1) {
    penalty += 15;
    signals.geo_spread_anomaly = true;
  } else if (planKey === "growth" && limits.max_locations >= 0 && distinctGeos > limits.max_locations) {
    penalty += 10;
    signals.geo_spread_anomaly = true;
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  let band: OrgHealthBand = "review";
  if (score >= 80) band = "trusted";
  else if (score >= 50) band = "monitor";

  return { score, band, signals };
}

/**
 * Recalculate and upsert organization_health. Never throws user-facing errors.
 * Call on: org created, location added, admin added/removed, reference check run,
 * abuse signal logged, limit block logged, monthly cron.
 */
export async function updateOrgHealth(organizationId: string): Promise<void> {
  try {
    const result = await computeOrgHealthScore(organizationId);
    const supabase = getSupabaseServer();
    await supabase.from("organization_health").upsert(
      {
        organization_id: organizationId,
        score: result.score,
        band: result.band,
        signals: result.signals as unknown as Record<string, unknown>,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );
  } catch (_) {
    // Silent: never surface to users
  }
}

/**
 * Read stored health row (server/super_admin only). Returns null if not yet calculated.
 */
export async function getOrgHealthFromTable(organizationId: string): Promise<{
  score: number;
  band: OrgHealthBand;
  signals: Record<string, unknown>;
  last_calculated_at: string;
} | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("organization_health")
    .select("score, band, signals, last_calculated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    score: data.score,
    band: data.band as OrgHealthBand,
    signals: (data.signals ?? {}) as Record<string, unknown>,
    last_calculated_at: data.last_calculated_at,
  };
}
