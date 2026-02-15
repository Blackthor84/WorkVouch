/**
 * GET/POST /api/admin/sandbox-v2/redteam — list or run red-team scenarios. Sandbox only. No external notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { runRedTeamScenario, listRedTeamRuns } from "@/lib/sandbox/redteam/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCENARIOS = ["sybil_attack", "collusion_ring", "fake_overlap_farm", "review_brigade", "employer_collusion"] as const;

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2AdminWithRole();
    const sandboxId = req.nextUrl.searchParams.get("sandbox_id");
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const runs = await listRedTeamRuns(sandboxId);
    return NextResponse.json({ success: true, data: runs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id: userId, isSuperAdmin } = await requireSandboxV2AdminWithRole();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id ?? body.sandboxId;
    const scenario = body.scenario;
    if (!sandboxId || !scenario) return NextResponse.json({ error: "sandbox_id and scenario required" }, { status: 400 });
    if (!SCENARIOS.includes(scenario)) return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
    const result = await runRedTeamScenario({
      sandboxId,
      scenario,
      createdBy: userId,
    });
    if (!result) return NextResponse.json({ error: "Failed to run scenario" }, { status: 500 });
    await writeAdminAuditLog({
      admin_user_id: userId,
      admin_email: null,
      admin_role: isSuperAdmin ? "superadmin" : "admin",
      action_type: "SANDBOX_REDTEAM_RUN",
      target_type: "system",
      target_id: result.id,
      before_state: null,
      after_state: { sandbox_id: sandboxId, scenario, detected: result.outcome.detected, abuse_signals: result.outcome.abuse_signals_created },
      reason: "Red-team scenario run in sandbox. No production impact.",
      is_sandbox: true,
    });
    return NextResponse.json({ success: true, id: result.id, outcome: result.outcome });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
