/**
 * GET /api/admin/sandbox-v2/employer-dashboard/listing-summary
 * Sandbox equivalent of GET /api/employer/listing-summary.
 * Uses sandbox_employment_records and sandbox_intelligence_outputs.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
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
      .select("id, employee_id")
      .eq("sandbox_id", sandboxId);
    const list = Array.isArray(records) ? records : [];
    const total_listed = list.length;
    const verified = total_listed;
    const pending = 0;
    const disputed = 0;

    const out: {
      total_listed: number;
      verified: number;
      pending: number;
      disputed: number;
      average_profile_strength?: number;
    } = {
      total_listed,
      verified,
      pending,
      disputed,
    };

    if (list.length > 0) {
      const employeeIds = [...new Set(list.map((r: { employee_id: string }) => r.employee_id))];
      const { data: snapshots } = await supabase
        .from("sandbox_intelligence_outputs")
        .select("employee_id, profile_strength")
        .eq("sandbox_id", sandboxId)
        .in("employee_id", employeeIds);
      const strengths = (snapshots ?? []).filter(
        (s: { profile_strength?: number }) => (s as { profile_strength?: number }).profile_strength != null
      ) as { profile_strength: number }[];
      if (strengths.length > 0) {
        out.average_profile_strength = Math.round(
          strengths.reduce((a: number, s: { profile_strength: number }) => a + s.profile_strength, 0) / strengths.length
        );
      }
    }

    return NextResponse.json(out);
  } catch (e) {
    console.error("[sandbox employer-dashboard listing-summary]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
