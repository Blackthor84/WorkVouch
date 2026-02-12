/**
 * DB performance and scaling audit: measure query times, suggest improvements.
 * Only when ENTERPRISE_SIMULATION_MODE=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";

export const dynamic = "force-dynamic";

const SLOW_MS = 200;

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();

    const sb = getSupabaseServer() as any;
    const results: { query: string; ms: number; slow: boolean }[] = [];
    const recommended_improvements: string[] = [];

    let t0 = Date.now();
    await sb.from("organization_usage").select("id").limit(10);
    let ms = Date.now() - t0;
    results.push({ query: "organization_usage (limit 10)", ms, slow: ms > SLOW_MS });
    if (ms > SLOW_MS) recommended_improvements.push("Consider index on organization_usage(organization_id, month).");

    t0 = Date.now();
    await sb.from("trust_scores").select("id").limit(10);
    ms = Date.now() - t0;
    results.push({ query: "trust_scores (limit 10)", ms, slow: ms > SLOW_MS });
    if (ms > SLOW_MS) recommended_improvements.push("Consider index on trust_scores(user_id).");

    t0 = Date.now();
    await sb.from("profiles").select("id, full_name, industry, state").ilike("full_name", "%Casino%").limit(20);
    ms = Date.now() - t0;
    results.push({ query: "profiles search (ilike name)", ms, slow: ms > SLOW_MS });
    if (ms > SLOW_MS) recommended_improvements.push("Consider trigram index on profiles(full_name) for search.");

    t0 = Date.now();
    await sb.from("employer_users").select("id").limit(5);
    await sb.from("locations").select("id").limit(5);
    ms = Date.now() - t0;
    results.push({ query: "employer_users + locations (sequential)", ms, slow: ms > SLOW_MS });

    const avgInsertMs = results.length ? Math.round(results.reduce((a, r) => a + r.ms, 0) / results.length) : 0;
    const scaling_risk_level =
      results.some((r) => r.slow) ? "moderate" : "low";
    if (results.filter((r) => r.slow).length >= 2) recommended_improvements.push("Review connection pool and N+1 patterns in dashboard routes.");

    return NextResponse.json({
      ok: true,
      performance_metrics: {
        audit_queries: results,
        avg_query_time_ms: avgInsertMs,
        dashboard_query_time_ms: avgInsertMs,
      },
      scaling_risk_level,
      recommended_improvements,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
