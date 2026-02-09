/**
 * GET /api/admin/sandbox-v2/employer-dashboard/dashboard-stats
 * Sandbox equivalent of GET /api/employer/dashboard-stats.
 * Uses sandbox tables and sandbox_id; no production auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    if (!sandboxId) return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { data: records } = await supabase
      .from("sandbox_employment_records")
      .select("id")
      .eq("sandbox_id", sandboxId);
    const list = Array.isArray(records) ? records : [];
    const totalVerified = list.length;

    return NextResponse.json({
      totalVerified,
      verificationCompletionRate: list.length > 0 ? 100 : null,
      disputeRate: 0,
      rehireEligibilityPct: list.length > 0 ? 100 : null,
    });
  } catch (e) {
    console.error("[sandbox employer-dashboard dashboard-stats]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
