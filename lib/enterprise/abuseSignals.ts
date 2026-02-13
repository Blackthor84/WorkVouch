/**
 * Server-side abuse detection for Starter/Growth plan gaming.
 * Signals:
 * - Distinct cities/states from hiring/locations (multi-geo on low tier)
 * - Unusually high reference check velocity (monthly_checks vs plan limit + time in period)
 * - Location count at or over plan limit
 * TODO: reference_graph_spanning_multiple_employers (requires employer/reference graph schema)
 * TODO: ip_region_clustering (requires request IP / region logging in schema)
 * Callers: if riskScore >= threshold, block new actions, return upgrade-required error, log to admin audit.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrgPlanLimits } from "./orgPlanLimits";

/** Threshold for surfacing "Enterprise recommended" (guidance only; does not block). */
export const ENTERPRISE_RECOMMENDED_THRESHOLD = 40;

export interface AbuseSignalsResult {
  riskScore: number;
  flags: string[];
  /** true when riskScore >= 40; guidance only, does not block. */
  enterprise_recommended: boolean;
  /** Set when enterprise_recommended; reason for upgrade CTA. */
  recommendation_reason: string | null;
  /** Non-blocking hint when enterprise_recommended. */
  hint: string | null;
}

/** Default threshold above which to soft-block and surface upgrade CTA. */
export const ABUSE_RISK_THRESHOLD = 70;

function normalizePlanKey(planType: string | null | undefined): string {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "growth" || t === "professional" || t === "pro") return "growth";
  return "starter";
}

/**
 * Compute abuse risk for an organization (Starter/Growth only; Enterprise returns 0).
 * - Distinct cities/states across locations (multi-geo on low tier)
 * - Location count at or over plan max
 * - Monthly checks near or over plan limit
 * Returns riskScore 0–100 and flags for admin review.
 */
export async function getAbuseSignals(organizationId: string): Promise<AbuseSignalsResult> {
  const supabase = getSupabaseServer();
  const flags: string[] = [];
  let score = 0;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan_type")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return { riskScore: 0, flags: [], enterprise_recommended: false, recommendation_reason: null, hint: null };
  }

  const planType = (org as { plan_type?: string | null }).plan_type;
  const planKey = normalizePlanKey(planType);
  if (planKey === "enterprise") {
    return { riskScore: 0, flags: [], enterprise_recommended: false, recommendation_reason: null, hint: null };
  }

  const limits = getOrgPlanLimits(planType);
  const month = new Date().toISOString().slice(0, 7);

  const [locationsRes, usageRes] = await Promise.all([
    supabase
      .from("locations")
      .select("id, city, state")
      .eq("organization_id", organizationId),
    supabase
      .from("organization_usage")
      .select("monthly_checks")
      .eq("organization_id", organizationId)
      .eq("month", month)
      .maybeSingle(),
  ]);

  const locations = (locationsRes.data ?? []) as { id: string; city: string | null; state: string | null }[];
  const monthlyChecks = (usageRes.data as { monthly_checks?: number } | null)?.monthly_checks ?? 0;

  const locationCount = locations.length;
  const distinctGeos = new Set(
    locations
      .map((l) => [l.city ?? "", l.state ?? ""].filter(Boolean).join("|"))
      .filter(Boolean)
  ).size;

  if (limits.max_locations >= 0 && locationCount >= limits.max_locations) {
    flags.push("location_count_at_or_over_plan_limit");
    score += 25;
  }

  if (planKey === "starter" && distinctGeos > 1) {
    flags.push("multi_geo_on_starter");
    score += 30;
  }
  if (planKey === "growth" && distinctGeos > limits.max_locations) {
    flags.push("multi_geo_exceeds_location_cap");
    score += 20;
  }

  if (limits.max_monthly_checks >= 0) {
    const usagePct = limits.max_monthly_checks > 0 ? monthlyChecks / limits.max_monthly_checks : 0;
    if (usagePct >= 1) {
      flags.push("monthly_checks_over_plan_limit");
      score += 35;
    } else if (usagePct >= 0.85) {
      flags.push("monthly_checks_near_limit");
      score += 15;
    }
    const dayOfMonth = new Date().getDate();
    if (usagePct >= 0.5 && dayOfMonth <= 7) {
      flags.push("high_check_velocity");
      score += 20;
    }
  }

  const riskScore = Math.min(100, score);
  const enterprise_recommended = riskScore >= ENTERPRISE_RECOMMENDED_THRESHOLD;
  const recommendation_reason = enterprise_recommended
    ? "Multi-location activity detected. Enterprise plan recommended."
    : null;
  const hint = enterprise_recommended
    ? "Enterprise Recommended: multi-location or high-volume activity detected."
    : null;

  if (flags.length > 0 && riskScore >= ABUSE_RISK_THRESHOLD) {
    await supabase.from("organization_metrics").insert({
      organization_id: organizationId,
      metric_name: "abuse_flag_triggered",
      metric_value: riskScore,
    });
  }
  if (enterprise_recommended) {
    await supabase.from("organization_metrics").insert({
      organization_id: organizationId,
      metric_name: "enterprise_recommended_signal",
      metric_value: riskScore,
    });
  }

  return {
    riskScore,
    flags,
    enterprise_recommended,
    recommendation_reason,
    hint,
  };
}

/**
 * Check if org should be soft-blocked due to abuse risk (call before mutating).
 * Returns { blocked: true, reason, signals } or { blocked: false }.
 */
export async function checkAbuseSoftBlock(organizationId: string): Promise<
  | { blocked: true; reason: string; signals: AbuseSignalsResult }
  | { blocked: false }
> {
  const signals = await getAbuseSignals(organizationId);
  if (signals.riskScore >= ABUSE_RISK_THRESHOLD) {
    // Note: enterprise_recommended (>=40) is guidance only; this block is >=70
    return {
      blocked: true,
      reason: "Unusual activity detected. Please upgrade your plan or contact support.",
      signals,
    };
  }
  return { blocked: false };
}
