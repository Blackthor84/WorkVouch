import { NextRequest, NextResponse } from "next/server";
import { requireSandboxMode } from "@/lib/sandbox/apiGuard";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/sandbox/observer — read-only. trustDelta, culture, signals, abuseRisk. SandboxId optional. */
export async function GET(req: NextRequest) {
  const guard = requireSandboxMode();
  if (guard) return guard;

  try {
    await requireSandboxV2Admin();
    const sandboxId =
      req.nextUrl.searchParams.get("sandboxId")?.trim() ||
      req.nextUrl.searchParams.get("sandbox_id")?.trim() ||
      null;

    const supabase = getServiceRoleClient();
    let resolvedId = sandboxId;

    if (!resolvedId) {
      const { data: sessions } = await supabase
        .from("sandbox_sessions")
        .select("id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);
      resolvedId = (sessions?.[0] as { id: string } | undefined)?.id ?? null;
    }

    if (!resolvedId) {
      return NextResponse.json({
        trustDelta: 0,
        culture: [] as string[],
        signals: [] as string[],
        abuseRisk: "LOW (0)",
      });
    }

    const { data: intel } = await supabase
      .from("sandbox_intelligence_outputs")
      .select("hiring_confidence, risk_index")
      .eq("sandbox_id", resolvedId);

    const rows = (intel ?? []) as { hiring_confidence?: number | null; risk_index?: number | null }[];
    const avgConf = rows.length ? rows.reduce((s, r) => s + (Number(r.hiring_confidence) || 0), 0) / rows.length : 0;
    const avgRisk = rows.length ? rows.reduce((s, r) => s + (Number(r.risk_index) || 0), 0) / rows.length : 0;

    const trustDelta = avgConf * 0.1;
    const culture = ["FAST_PACED (0.62)", "TEAM_BASED (0.51)"];
    const signals = ["LOW_FRICTION (0.44)"];
    const abuseRisk =
      avgRisk < 0.3 ? `LOW (${avgRisk.toFixed(2)})` : avgRisk < 0.6 ? `MEDIUM (${avgRisk.toFixed(2)})` : `HIGH (${avgRisk.toFixed(2)})`;

    return NextResponse.json({
      trustDelta: Number(trustDelta.toFixed(2)),
      culture,
      signals,
      abuseRisk,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Forbidden: admin or super_admin required") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
