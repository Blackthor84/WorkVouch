/**
 * GET /api/admin/scale-metrics
 * Read-only scale metrics for super_admin: orgs at limit, blocked actions, abuse flags.
 * Used by Scale Metrics Dashboard (/admin/scale-metrics).
 */

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    limitBlockRes,
    abuseFlagRes,
    usageRes,
  ] = await Promise.all([
    supabase
      .from("organization_metrics")
      .select("organization_id")
      .eq("metric_name", "limit_block")
      .gte("created_at", since),
    supabase
      .from("organization_metrics")
      .select("organization_id, metric_value")
      .eq("metric_name", "abuse_flag_triggered")
      .gte("created_at", since),
    supabase
      .from("organization_usage")
      .select("organization_id, monthly_checks")
      .eq("month", new Date().toISOString().slice(0, 7)),
  ]);

  const limitBlocks = limitBlockRes.data ?? [];
  const abuseFlags = (abuseFlagRes.data ?? []) as { organization_id: string; metric_value?: number }[];
  const usageRows = (usageRes.data ?? []) as { organization_id: string; monthly_checks: number }[];
  const enterpriseRecommendedCount = abuseFlags.filter((r) => (r.metric_value ?? 0) >= 40).length;

  const orgIdsWithBlock = new Set(limitBlocks.map((r) => r.organization_id));
  const orgIdsWithAbuse = new Set(abuseFlags.map((r) => r.organization_id));

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, plan_type");
  const orgList = (orgs ?? []) as { id: string; plan_type: string | null }[];
  const planLimits = await import("@/lib/enterprise/orgPlanLimits").then((m) => m.ORG_PLAN_LIMITS);
  let orgsAtLimit = 0;
  for (const org of orgList) {
    const planKey = (org.plan_type ?? "starter").toLowerCase();
    const limits = planKey === "enterprise" || planKey === "custom"
      ? planLimits.enterprise
      : planKey === "growth" || planKey === "professional" || planKey === "pro"
        ? planLimits.growth
        : planLimits.starter;
    if (limits.unlimited) continue;
    const usage = usageRows.find((u) => u.organization_id === org.id);
    const checks = usage?.monthly_checks ?? 0;
    if (limits.max_monthly_checks >= 0 && checks >= limits.max_monthly_checks) {
      orgsAtLimit++;
    }
  }

  const blockedByPlan: Record<string, number> = {};
  for (const row of limitBlocks) {
    const org = orgList.find((o) => o.id === row.organization_id);
    const plan = org?.plan_type ?? "starter";
    blockedByPlan[plan] = (blockedByPlan[plan] ?? 0) + 1;
  }

  return NextResponse.json({
    success: true,
    metrics: {
      limit_blocks_last_24h: limitBlocks.length,
      abuse_flags_triggered_last_24h: abuseFlags.length,
      orgs_at_limit_count: orgsAtLimit,
      blocked_actions_by_plan: blockedByPlan,
      unique_orgs_blocked: orgIdsWithBlock.size,
      unique_orgs_abuse_flag: orgIdsWithAbuse.size,
      enterprise_recommended_count: enterpriseRecommendedCount,
      enterprise_recommended_reason:
        enterpriseRecommendedCount > 0
          ? "Multi-location activity detected. Enterprise plan recommended."
          : null,
    },
    note: "checks_per_minute requires time-bucketed logging (TODO).",
  });
}
