/**
 * Server-side enforcement of organization plan limits.
 * Reusable function: call BEFORE insert/update for add_location, add_admin, run_check.
 * Uses plan_limits table (with app fallback), organization_usage (auto-create + monthly reset),
 * organization_metrics for limit_block logging, and enterprise_features.multi_property to skip location cap.
 * Superadmin always bypasses (allowed: true).
 */

import { NextResponse } from "next/server";
import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrgPlanLimits } from "./orgPlanLimits";

export type CheckOrgLimitsAction =
  | "add_location"
  | "add_admin"
  | "run_check"
  | "bulk_hire"
  | "reference_lookup"
  | "reference_check";

export interface CheckOrgLimitsResult {
  allowed: boolean;
  error?: string;
  /** Alias for error; use for upgrade CTA messaging. */
  reason?: string;
  /** Current plan (e.g. starter, growth, enterprise) when allowed: false. */
  planType?: string | null;
}

const PLAN_LIMIT_ERROR = "Plan limit reached. Upgrade required.";

/** Normalize plan key for plan_limits lookup (starter | growth | enterprise). */
function normalizePlanKey(planType: string | null | undefined): string {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "growth" || t === "professional" || t === "pro") return "growth";
  return "starter";
}

/** -1 means unlimited. */
interface PlanLimitRow {
  max_locations: number;
  max_admins: number;
  max_monthly_checks: number;
}

/** Organization row fields we need. */
interface OrgRow {
  id: string;
  plan_type: string | null;
  enterprise_features: { multi_property?: boolean } | null;
}

/** organization_usage row. */
interface UsageRow {
  id: string;
  organization_id: string;
  month: string;
  monthly_checks: number;
  last_reset: string | null;
}

/**
 * Ensure organization_usage row exists for this org + month; create if missing.
 * If last_reset is older than 30 days, reset monthly_checks to 0 and set last_reset = now().
 */
async function ensureUsageAndMaybeReset(
  supabase: ReturnType<typeof getSupabaseServer>,
  organizationId: string,
  month: string
): Promise<UsageRow | null> {
  const { data: existing } = await supabase
    .from("organization_usage")
    .select("id, organization_id, month, monthly_checks, last_reset")
    .eq("organization_id", organizationId)
    .eq("month", month)
    .maybeSingle();

  const now = new Date().toISOString();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (existing) {
    const lastReset = existing.last_reset ? new Date(existing.last_reset).getTime() : 0;
    if (Date.now() - lastReset > thirtyDaysMs) {
      await supabase
        .from("organization_usage")
        .update({ monthly_checks: 0, last_reset: now, updated_at: now })
        .eq("id", existing.id);
      return {
        ...existing,
        monthly_checks: 0,
        last_reset: now,
      } as UsageRow;
    }
    return existing as UsageRow;
  }

  const { data: inserted } = await supabase
    .from("organization_usage")
    .insert({
      organization_id: organizationId,
      month,
      unlock_count: 0,
      monthly_checks: 0,
      last_reset: now,
      updated_at: now,
    })
    .select("id, organization_id, month, monthly_checks, last_reset")
    .single();

  return inserted as UsageRow | null;
}

/**
 * Log a limit_block event to organization_metrics.
 * Silently triggers organization_health recalculation (no user-facing errors).
 */
async function logLimitBlock(
  supabase: ReturnType<typeof getSupabaseServer>,
  organizationId: string
): Promise<void> {
  await supabase.from("organization_metrics").insert({
    organization_id: organizationId,
    metric_name: "limit_block",
    metric_value: 1,
  });
  import("@/lib/enterprise/orgHealthScore").then(({ updateOrgHealth }) => {
    updateOrgHealth(organizationId).catch(() => {});
  });
}

/**
 * If org health band is "review", log recommendation only (observational; no blocking).
 * TODO: Score-based search ranking when enterprise visibility is enabled.
 * TODO: Enterprise-only visibility toggle for org health band.
 * TODO: Exportable compliance reports including health band.
 * TODO: Customer-facing explainer copy (later phase).
 */
function logReviewRecommendationIfNeeded(organizationId: string): void {
  void import("@/lib/enterprise/orgHealthScore").then(({ getOrgHealthFromTable }) => {
    void getOrgHealthFromTable(organizationId).then((row) => {
      if (row?.band === "review") {
        void getSupabaseServer()
          .from("organization_metrics")
          .insert({
            organization_id: organizationId,
            metric_name: "org_health_review_recommendation_logged",
            metric_value: row.score,
          });
      }
    });
  });
}

/**
 * Fetch plan limits: from plan_limits table if row exists, else from app constants.
 */
async function getPlanLimits(
  supabase: ReturnType<typeof getSupabaseServer>,
  planKey: string
): Promise<PlanLimitRow> {
  const { data: row } = await supabase
    .from("plan_limits")
    .select("max_locations, max_admins, max_monthly_checks")
    .eq("plan_key", planKey)
    .maybeSingle();

  if (row) {
    return {
      max_locations: row.max_locations ?? 1,
      max_admins: row.max_admins ?? 2,
      max_monthly_checks: row.max_monthly_checks ?? 25,
    };
  }

  const appLimits = getOrgPlanLimits(planKey);
  return {
    max_locations: appLimits.max_locations,
    max_admins: appLimits.max_admins,
    max_monthly_checks: appLimits.max_monthly_checks,
  };
}

/**
 * checkOrgLimits(organizationId | { organizationId }, action)
 * - add_location: enforce location count; skip cap if enterprise or enterprise_features.multi_property.
 * - add_admin: enforce employer_users count.
 * - run_check / reference_check / bulk_hire / reference_lookup: enforce organization_usage.monthly_checks; if allowed, increment atomically.
 * Returns { allowed, error?, reason? }. All 403 responses must use error: "Plan limit reached. Upgrade required."
 */
export async function checkOrgLimits(
  organizationIdOrContext: string | { organizationId: string },
  action: CheckOrgLimitsAction
): Promise<CheckOrgLimitsResult> {
  const role = await getCurrentUserRole();
  if (role === "superadmin") return { allowed: true };

  const organizationId =
    typeof organizationIdOrContext === "string"
      ? organizationIdOrContext
      : organizationIdOrContext.organizationId;
  const supabase = getSupabaseServer();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan_type, enterprise_features")
    .eq("id", organizationId)
    .single();

  if (!org) {
    return { allowed: false, error: "Organization not found", reason: "Organization not found", planType: null };
  }

  const orgRow = org as unknown as OrgRow;
  const planKey = normalizePlanKey(orgRow.plan_type);
  const limits = await getPlanLimits(supabase, planKey);

  const isEnterprise = planKey === "enterprise";
  const enterpriseFeatures = (orgRow.enterprise_features ?? {}) as { multi_property?: boolean };
  const skipLocationCap = isEnterprise || enterpriseFeatures.multi_property === true;

  if (action === "add_location") {
    if (skipLocationCap) return { allowed: true };
    if (limits.max_locations < 0) return { allowed: true };

    const { count } = await supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const currentLocations = count ?? 0;
    if (currentLocations >= limits.max_locations) {
      await logLimitBlock(supabase, organizationId);
      logReviewRecommendationIfNeeded(organizationId);
      return { allowed: false, error: PLAN_LIMIT_ERROR, reason: PLAN_LIMIT_ERROR, planType: orgRow.plan_type ?? planKey };
    }
    return { allowed: true };
  }

  if (action === "add_admin") {
    if (isEnterprise || limits.max_admins < 0) return { allowed: true };

    const { count } = await supabase
      .from("employer_users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const currentAdmins = count ?? 0;
    if (currentAdmins >= limits.max_admins) {
      await logLimitBlock(supabase, organizationId);
      logReviewRecommendationIfNeeded(organizationId);
      return { allowed: false, error: PLAN_LIMIT_ERROR, reason: PLAN_LIMIT_ERROR };
    }
    return { allowed: true };
  }

  const isConsumeCheckAction =
    action === "run_check" ||
    action === "bulk_hire" ||
    action === "reference_lookup" ||
    action === "reference_check";
  if (isConsumeCheckAction) {
    const month = new Date().toISOString().slice(0, 7);
    const usage = await ensureUsageAndMaybeReset(supabase, organizationId, month);
    if (!usage) {
      return {
        allowed: false,
        error: "Failed to load or create usage record",
        reason: "Failed to load or create usage record",
        planType: orgRow.plan_type ?? planKey,
      };
    }

    if (isEnterprise || limits.max_monthly_checks < 0) {
      await supabase
        .from("organization_usage")
        .update({
          monthly_checks: usage.monthly_checks + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usage.id);
      return { allowed: true };
    }

    if (usage.monthly_checks >= limits.max_monthly_checks) {
      await logLimitBlock(supabase, organizationId);
      logReviewRecommendationIfNeeded(organizationId);
      return { allowed: false, error: PLAN_LIMIT_ERROR, reason: PLAN_LIMIT_ERROR, planType: orgRow.plan_type ?? planKey };
    }

    await supabase
      .from("organization_usage")
      .update({
        monthly_checks: usage.monthly_checks + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", usage.id);

    return { allowed: true };
  }

  return { allowed: true };
}

/** Optional health from getOrgHealthScore; when provided, 403 body includes health_status. */
export interface PlanLimit403Health {
  status: "healthy" | "at_risk" | "misaligned";
  recommended_plan: string | null;
}

/** Standardized 403 response for plan limit blocks. Use whenever checkOrgLimits() returns allowed: false. */
export function planLimit403Response(
  result: CheckOrgLimitsResult,
  action: CheckOrgLimitsAction,
  health?: PlanLimit403Health | null
): NextResponse {
  const enterpriseRecommended = health?.status === "at_risk" || health?.status === "misaligned";
  return NextResponse.json(
    {
      success: false,
      code: "PLAN_LIMIT_REACHED",
      error: "Upgrade Required",
      message: "🚨 Upgrade Required: This action exceeds your current plan limits.",
      detail:
        "Your current plan does not support this action. Upgrade to Enterprise to continue without limits."
        + (enterpriseRecommended ? " Enterprise Recommended for your usage." : ""),
      recommended_plan: "enterprise",
      health_status: health?.status ?? null,
      action,
      plan: result.planType ?? null,
      upgrade_recommended: true,
      cta_text: "Upgrade to Enterprise",
      cta_url: "/pricing",
    },
    { status: 403 }
  );
}
