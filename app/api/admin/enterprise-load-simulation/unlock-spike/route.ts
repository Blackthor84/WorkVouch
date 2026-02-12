/**
 * Simulate unlock spike: run N unlock increments with configurable concurrency.
 * Only when ENTERPRISE_SIMULATION_MODE=true. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";
import { checkOrgLimits, incrementOrgUnlockCount } from "@/lib/enterprise/enforceOrgLimits";
import { incrementUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function doOneUnlock(
  organizationId: string,
  employerAccountId: string,
  month: string
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const orgCheck = await checkOrgLimits({ organizationId, month }, "unlock");
    if (!orgCheck.allowed) {
      return { ok: false, latencyMs: Date.now() - t0, error: orgCheck.error };
    }
    await incrementUsage(employerAccountId, "search", 1);
    await incrementOrgUnlockCount(organizationId, month);
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    return {
      ok: false,
      latencyMs: Date.now() - t0,
      error: e instanceof Error ? e.message : "Unknown",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();

    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId as string;
    const employerAccountId = body.employerAccountId as string;
    const count = Math.min(1000, Math.max(1, Number(body.count) || 100));
    const concurrency = Math.min(50, Math.max(1, Number(body.concurrency) || 10));

    if (!orgId || !employerAccountId) {
      return NextResponse.json(
        { error: "orgId and employerAccountId required" },
        { status: 400 }
      );
    }

    const month = new Date().toISOString().slice(0, 7);
    const latencies: number[] = [];
    let failures = 0;
    let raceOrDouble = 0;

    const runBatch = async (offset: number, batchSize: number) => {
      const promises = Array.from({ length: batchSize }, () =>
        doOneUnlock(orgId, employerAccountId, month)
      );
      const results = await Promise.all(promises);
      results.forEach((r) => {
        latencies.push(r.latencyMs);
        if (!r.ok) failures++;
      });
    };

    for (let i = 0; i < count; i += concurrency) {
      const batchSize = Math.min(concurrency, count - i);
      await runBatch(i, batchSize);
    }

    const sb = getSupabaseServer() as any;
    const { data: usageRow } = await sb
      .from("organization_usage")
      .select("unlock_count")
      .eq("organization_id", orgId)
      .eq("month", month)
      .maybeSingle();
    const finalUnlockCount = (usageRow?.unlock_count ?? 0) as number;

    const sorted = [...latencies].sort((a, b) => a - b);
    const avgLatency =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    const maxLatency = sorted[sorted.length - 1] ?? 0;

    return NextResponse.json({
      ok: true,
      performance_metrics: {
        requested_unlocks: count,
        successful: count - failures,
        failures,
        avg_unlock_latency_ms: avgLatency,
        p95_latency_ms: p95,
        max_latency_ms: maxLatency,
        final_organization_usage_unlock_count: finalUnlockCount,
        race_conditions_detected: raceOrDouble,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
