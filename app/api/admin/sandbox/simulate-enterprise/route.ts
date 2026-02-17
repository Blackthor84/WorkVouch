/**
 * POST /api/admin/sandbox/simulate-enterprise
 * Sandbox-only. Simulate enterprise abuse/load safely (e.g. inject metrics, no real PII).
 * Requires admin.isSandbox. Production returns 403.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (APP_MODE !== "sandbox" || !admin.isSandbox) return adminForbiddenResponse();

  try {
    const body = await req.json().catch(() => ({})) as { orgId?: string; scenario?: string };
    const orgId = body.orgId;
    const scenario = body.scenario ?? "abuse_flags"; // abuse_flags | limit_block | high_usage

    if (!orgId || typeof orgId !== "string") {
      return NextResponse.json({ success: false, error: "orgId required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: org } = await supabase
      .from("organizations")
      .select("id, mode")
      .eq("id", orgId)
      .single();

    if (!org || (org as { mode?: string }).mode !== "sandbox") {
      return NextResponse.json({ success: false, error: "Sandbox org not found" }, { status: 404 });
    }

    if (scenario === "abuse_flags") {
      await supabase.from("organization_metrics").insert({
        organization_id: orgId,
        metric_name: "abuse_flag_triggered",
        metric_value: 50,
        created_at: new Date().toISOString(),
      });
    } else if (scenario === "limit_block") {
      await supabase.from("organization_metrics").insert({
        organization_id: orgId,
        metric_name: "limit_block",
        created_at: new Date().toISOString(),
      });
    } else if (scenario === "high_usage") {
      const month = new Date().toISOString().slice(0, 7);
      await supabase.from("organization_usage").upsert(
        { organization_id: orgId, month, monthly_checks: 9999 },
        { onConflict: "organization_id,month" }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Simulated enterprise scenario: ${scenario}`,
      orgId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
