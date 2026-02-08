import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

/**
 * Sandbox intelligence recalculation. Uses canonical v1 engine only.
 * Optional body: sentimentMultiplier (0.5–2.0) — sandbox-only; applied after v1 score then clamped 0–100.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const sentimentMultiplier =
      typeof body.sentimentMultiplier === "number"
        ? body.sentimentMultiplier
        : undefined;

    if (!sandbox_id)
      return NextResponse.json({ error: "Missing sandbox_id" }, { status: 400 });

    const result = await runSandboxIntelligenceRecalculation(sandbox_id, {
      sentimentMultiplier,
    });
    if (!result.ok)
      return NextResponse.json(
        { error: result.error ?? "Recalculation failed" },
        { status: 500 }
      );

    await calculateSandboxMetrics(sandbox_id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized")
      return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
