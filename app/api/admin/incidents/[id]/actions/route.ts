/**
 * POST /api/admin/incidents/[id]/actions — add action (mitigation note, response, escalation). Admin only. Audited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { addIncidentAction } from "@/lib/admin/incidents";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminContext(req);
    if (!admin.isAdmin) return adminForbiddenResponse();

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action_type = typeof body.action_type === "string" ? body.action_type.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const action_metadata = (body.action_metadata && typeof body.action_metadata === "object") ? body.action_metadata : {};

    if (!action_type) return NextResponse.json({ error: "action_type is required" }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

    const meta = getAuditRequestMeta(req);
    const actionId = await addIncidentAction({
      incidentId: id,
      admin_user_id: admin.authUserId,
      admin_role: admin.isSuperAdmin ? "superadmin" : "admin",
      action_type,
      action_metadata,
      is_sandbox: admin.isSandbox,
      reason,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    });

    return NextResponse.json({ ok: true, action_id: actionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 });
    console.error("[admin/incidents/[id]/actions]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
