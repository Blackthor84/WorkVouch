/**
 * GET/POST /api/admin/sandbox-v2/replays — list replay sessions or create snapshot/session.
 * Sandbox only. Admin required. Replay is READ-ONLY; never mutates sandbox state.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { listReplaySessions, createSandboxSnapshot, createReplaySession } from "@/lib/sandbox/replay/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2AdminWithRole();
    const sandboxId = req.nextUrl.searchParams.get("sandbox_id");
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const sessions = await listReplaySessions(sandboxId);
    return NextResponse.json({ success: true, data: sessions });
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
    if (!sandboxId) return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    const adminRole = isSuperAdmin ? "superadmin" as const : "admin" as const;

    if (body.action === "snapshot") {
      const result = await createSandboxSnapshot({
        sandboxId,
        name: body.name,
        createdBy: userId,
      });
      if (!result) return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
      await writeAdminAuditLog({
        admin_user_id: userId,
        admin_email: null,
        admin_role: adminRole,
        action_type: "SANDBOX_REPLAY_SNAPSHOT",
        target_type: "system",
        target_id: result.id,
        before_state: null,
        after_state: { sandbox_id: sandboxId, name: body.name ?? null },
        reason: "Sandbox snapshot created for replay. Read-only replay; no production impact.",
        is_sandbox: true,
      });
      return NextResponse.json({ success: true, snapshot_id: result.id });
    }

    if (body.action === "replay_session") {
      const result = await createReplaySession({
        sandboxId,
        name: body.name ?? "Replay session",
        snapshotId: body.snapshot_id ?? body.snapshotId ?? null,
        ruleVersionId: body.rule_version_id ?? null,
        createdBy: userId,
      });
      if (!result) return NextResponse.json({ error: "Failed to create replay session" }, { status: 500 });
      await writeAdminAuditLog({
        admin_user_id: userId,
        admin_email: null,
        admin_role: adminRole,
        action_type: "SANDBOX_REPLAY_SESSION",
        target_type: "system",
        target_id: result.id,
        before_state: null,
        after_state: { sandbox_id: sandboxId, name: body.name ?? "Replay session", snapshot_id: body.snapshot_id ?? null },
        reason: "Sandbox replay session created. Replay is read-only.",
        is_sandbox: true,
      });
      return NextResponse.json({ success: true, replay_session_id: result.id });
    }

    return NextResponse.json({ error: "action must be snapshot or replay_session" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
