/**
 * GET /api/sandbox/fuzzer/runs/[id]/events — abuse/rate-limit events for overlay. Admin-only.
 * Returns sandbox_events for this run's scenario_id (and optional time window) for overlay on Trust Curve.
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getFuzzRun } from "@/lib/sandbox/dsl/fuzzer/runFuzzer";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing run id" }, { status: 400 });
  }

  try {
    const run = await getFuzzRun(id);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    const scenarioId = (run as { scenario_id?: string }).scenario_id;
    if (!scenarioId) {
      return NextResponse.json({ abuse: [], rate_limit: [] });
    }
    const supabase = getServiceRoleClient();
    const { data: abuse } = await supabase
      .from("sandbox_events")
      .select("id, type, step_id, created_at, metadata")
      .eq("scenario_id", scenarioId)
      .eq("type", "abuse_flagged")
      .order("created_at");
    const { data: rateLimit } = await supabase
      .from("sandbox_events")
      .select("id, type, step_id, created_at, metadata")
      .eq("scenario_id", scenarioId)
      .or("type.eq.rate_limit,type.eq.rate_limited,type.ilike.%limit%")
      .order("created_at");
    return NextResponse.json({
      abuse: abuse ?? [],
      rate_limit: rateLimit ?? [],
    });
  } catch (e) {
    console.error("[sandbox/fuzzer/runs/[id]/events]", e);
    return NextResponse.json({ abuse: [], rate_limit: [] }, { status: 200 });
  }
}
