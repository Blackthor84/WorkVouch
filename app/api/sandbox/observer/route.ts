import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getSandboxObserverData } from "@/lib/sandbox/observerData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SAFE_OBSERVER_PAYLOAD = {
  status: "idle",
  events: [] as unknown[],
  metrics: {} as Record<string, unknown>,
  trustDelta: 0,
  culture: [] as string[],
  signals: [] as string[],
  abuseRisk: 0,
  reputation_changes: [] as { employee_id: string; delta: number; label?: string }[],
  abuse_flags: [] as { id: string; signal_type: string; severity: number; created_at: string }[],
  risk_signals: [] as string[],
  trust_scores: [] as { employee_id: string; score: number }[],
};

/** GET /api/sandbox/observer — read-only real data from sandbox_intelligence_outputs. Admin/superadmin only. Always returns JSON. */
export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const sandboxId =
    req.nextUrl.searchParams.get("sandboxId")?.trim() ||
    req.nextUrl.searchParams.get("sandbox_id")?.trim() ||
    undefined;

  try {
    const data = await getSandboxObserverData(sandboxId);
    return NextResponse.json({
      ...SAFE_OBSERVER_PAYLOAD,
      ...data,
      status: "ok",
      events: [],
      metrics: {},
    });
  } catch (e) {
    console.error("[sandbox/observer]", e);
    return NextResponse.json(SAFE_OBSERVER_PAYLOAD, { status: 200 });
  }
}
