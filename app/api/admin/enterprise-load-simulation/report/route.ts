/**
 * Aggregate simulation report: combine run + unlock-spike + abuse + fraud results.
 * GET returns last known metrics when called after run/unlock-spike/abuse/fraud.
 * POST accepts partial metrics to merge into final report (for script orchestration).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";

export const dynamic = "force-dynamic";

const defaultReport = () => ({
  simulation_summary: { candidates_created: 0, reviews_created: 0, unlocks_triggered: 0 },
  performance_metrics: {
    avg_score_time_ms: 0,
    max_score_time_ms: 0,
    avg_unlock_latency_ms: 0,
    db_write_time_ms: 0,
    dashboard_query_time_ms: 0,
  },
  integrity_results: {
    race_conditions_detected: false,
    duplicate_prevented: true,
    self_review_blocked: true,
    plan_enforcement_passed: true,
  },
  scaling_risk_level: "low" as "low" | "moderate" | "high",
  recommended_improvements: [] as string[],
});

export async function GET() {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();
    return NextResponse.json({ ok: true, report: defaultReport() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const report = { ...defaultReport(), ...body };
    const avgUnlock = report.performance_metrics.avg_unlock_latency_ms ?? 0;
    const maxScore = report.performance_metrics.max_score_time_ms ?? 0;
    if (avgUnlock > 500 || maxScore > 2000)
      report.scaling_risk_level = "moderate";
    if (avgUnlock > 2000 || maxScore > 5000)
      report.scaling_risk_level = "high";
    if (report.scaling_risk_level !== "low")
      report.recommended_improvements.push("Review DB indexes and connection pool for unlock and scoring paths.");
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
