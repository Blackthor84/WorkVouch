/**
 * GET /api/admin/alerts/[id] — single alert.
 * PATCH /api/admin/alerts/[id] — acknowledge, dismiss, mark read, silence (superadmin).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  markAlertRead,
  acknowledgeAlert,
  dismissAlert,
  silenceAlert,
} from "@/lib/admin/alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    if (!admin.isAdmin) return adminForbiddenResponse();

    const { id } = await params;
    const supabase = getServiceRoleClient() as any;
    const { data, error } = await supabase
      .from("admin_alerts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[admin/alerts/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    if (!admin.isAdmin) return adminForbiddenResponse();

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = (body.action as string)?.toLowerCase();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const silenced_until = typeof body.silenced_until === "string" ? body.silenced_until : undefined;

    const adminRole = admin.isSuperAdmin ? "superadmin" : "admin";
    const isSandbox = admin.isSandbox;

    if (action === "read") {
      await markAlertRead(id);
      return NextResponse.json({ ok: true });
    }

    if (action === "acknowledge") {
      await acknowledgeAlert({
        alertId: id,
        admin_user_id: admin.authUserId,
        admin_email: admin.email,
        admin_role: adminRole,
        is_sandbox: isSandbox,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "dismiss") {
      const supabase = getServiceRoleClient() as any;
      const { data: alert } = await supabase
        .from("admin_alerts")
        .select("severity")
        .eq("id", id)
        .single();
      const isCritical = (alert as { severity?: string } | null)?.severity === "critical";
      if (isCritical && !admin.isSuperAdmin && !reason) {
        return NextResponse.json(
          { error: "Dismissing a critical alert requires a reason (or superadmin)" },
          { status: 400 }
        );
      }
      await dismissAlert({
        alertId: id,
        admin_user_id: admin.authUserId,
        admin_email: admin.email,
        admin_role: adminRole,
        is_sandbox: isSandbox,
        reason: reason || "Dismissed from admin UI",
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "silence") {
      if (!admin.isSuperAdmin) {
        return NextResponse.json({ error: "Only superadmin can silence alerts" }, { status: 403 });
      }
      if (!silenced_until) {
        return NextResponse.json({ error: "silenced_until required" }, { status: 400 });
      }
      await silenceAlert({
        alertId: id,
        silenced_until,
        admin_user_id: admin.authUserId,
        admin_email: admin.email,
        admin_role: "superadmin",
        is_sandbox: isSandbox,
        reason: reason || "Silenced from admin UI",
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("not found") || msg.includes("does not match")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    console.error("[admin/alerts/[id]] PATCH", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
