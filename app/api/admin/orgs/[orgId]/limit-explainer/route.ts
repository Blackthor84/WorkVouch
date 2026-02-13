/**
 * GET /api/admin/orgs/[orgId]/limit-explainer
 * Super_admin only. Aggregates plan limits, current usage, blocked actions (30d), abuse signals.
 * Returns recommendation: "none" | "enterprise".
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrgPlanLimits } from "@/lib/enterprise/orgPlanLimits";
import { getAbuseSignals } from "@/lib/enterprise/abuseSignals";
import { getOrgHealthScore } from "@/lib/enterprise/orgHealthScore";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  props: { params: Promise<{ orgId: string }> }
) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const { orgId } = await props.params;
  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const month = new Date().toISOString().slice(0, 7);

  const [orgRow, usageRow, blockRows, abuse, health] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, plan_type")
      .eq("id", orgId)
      .single(),
    supabase
      .from("organization_usage")
      .select("monthly_checks")
      .eq("organization_id", orgId)
      .eq("month", month)
      .maybeSingle(),
    supabase
      .from("organization_metrics")
      .select("id, created_at")
      .eq("organization_id", orgId)
      .eq("metric_name", "limit_block")
      .gte("created_at", since30d),
    getAbuseSignals(orgId),
    getOrgHealthScore(orgId),
  ]);

  if (!orgRow.data) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const planType = (orgRow.data as { plan_type?: string | null }).plan_type;
  const limits = getOrgPlanLimits(planType);
  const monthlyChecks = (usageRow.data as { monthly_checks?: number } | null)?.monthly_checks ?? 0;
  const blockedActionsLast30Days = (blockRows.data ?? []).length;

  const usagePercent =
    limits.max_monthly_checks >= 0 && limits.max_monthly_checks > 0
      ? Math.min(100, Math.round((monthlyChecks / limits.max_monthly_checks) * 100))
      : null;

  const recommendation: "none" | "enterprise" =
    health.status === "misaligned" || health.status === "at_risk" || health.enterpriseRecommended
      ? "enterprise"
      : "none";

  return NextResponse.json({
    organization_id: orgId,
    plan_type: planType ?? "starter",
    plan_limits: {
      max_locations: limits.max_locations,
      max_admins: limits.max_admins,
      max_monthly_checks: limits.max_monthly_checks,
    },
    current_usage: {
      monthly_checks: monthlyChecks,
      usage_percent: usagePercent,
    },
    blocked_actions_last_30_days: blockedActionsLast30Days,
    abuse_signals: {
      risk_score: abuse.riskScore,
      flags: abuse.flags,
      enterprise_recommended: abuse.enterprise_recommended,
      recommendation_reason: abuse.recommendation_reason,
      hint: abuse.hint,
    },
    health: {
      status: health.status,
      score: health.score,
      summary: health.summary,
      recommended_plan: health.recommended_plan,
    },
    recommendation,
    explanation:
      recommendation === "enterprise"
        ? "Usage near or at limits, limit blocks in the last 30 days, or abuse signals suggest upgrading to Enterprise for headroom and multi-location support."
        : "Usage and abuse signals are within normal range for current plan.",
  });
}
