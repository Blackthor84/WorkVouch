/**
 * GET /api/admin/sandbox-v2/employer-dashboard/usage
 * Sandbox equivalent of GET /api/employer/usage.
 * Uses sandbox data; no Stripe. Same response shape.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { getPlanLimits } from "@/lib/planLimits";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    if (!sandboxId) return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { data: employers } = await supabase
      .from("sandbox_employers")
      .select("id, plan_tier")
      .eq("sandbox_id", sandboxId)
      .limit(1);
    const first = Array.isArray(employers) ? employers[0] : null;
    const planTier = (first as { plan_tier?: string } | null)?.plan_tier ?? "pro";
    const limits = getPlanLimits(planTier);

    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return NextResponse.json({
      planTier,
      limits,
      reportsUsed: 0,
      searchesUsed: 0,
      seatsUsed: 0,
      seatsAllowed: limits.seats ?? 10,
      billingCycleStart: cycleStart.toISOString().slice(0, 10),
      billingCycleEnd: cycleEnd.toISOString().slice(0, 10),
    });
  } catch (e) {
    console.error("[sandbox employer-dashboard usage]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
