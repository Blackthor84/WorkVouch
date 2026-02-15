/**
 * POST/GET Fraud Stress-Test Playbook. Sandbox only. Reports exportable.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { runStressTestPlaybook, listStressTestReports } from "@/lib/sandbox/playbook/stressTest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCENARIOS = ["sybil_attack", "collusion_ring", "fake_overlap_farm", "review_brigade", "employer_collusion"] as const;

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2AdminWithRole();
    const sandboxId = req.nextUrl.searchParams.get("sandbox_id");
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const list = await listStressTestReports(sandboxId);
    return NextResponse.json({ success: true, data: list });
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
    const config = body.config ?? {};
    const result = await runStressTestPlaybook({
      sandboxId,
      scenario,
      config: { scale: config.scale, duration_seconds: config.duration_seconds },
      createdBy: userId,
    });
    if (!result) return NextResponse.json({ error: "Failed to run playbook" }, { status: 500 });
    await writeAdminAuditLog({
      admin_user_id: userId,
      admin_email: null,
      admin_role: isSuperAdmin ? "superadmin" : "admin",
      action_type: "SANDBOX_PLAYBOOK_RUN",
      target_type: "system",
      target_id: result.id,
      before_state: null,
      after_state: { sandbox_id: sandboxId, scenario, report_id: result.id },
      reason: "Fraud stress-test playbook run in sandbox. Reports exportable; no production impact.",
      is_sandbox: true,
    });
    return NextResponse.json({ success: true, id: result.id, report: result.report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
