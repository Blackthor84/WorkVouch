/**
 * GET /api/admin/incidents/[id] — incident detail with actions timeline.
 * PATCH /api/admin/incidents/[id] — update status (mitigated | resolved). CRITICAL resolve requires superadmin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getIncidentWithActions, updateIncidentStatus } from "@/lib/admin/incidents";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

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
    const { incident, actions } = await getIncidentWithActions(id);
    if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    return NextResponse.json({ incident, actions });
  } catch (e) {
    console.error("[admin/incidents/[id]]", e);
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
    const status = (body.status as string)?.toLowerCase();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (status !== "mitigated" && status !== "resolved") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const supabase = getServiceRoleClient() as any;
    const { data: incident } = await supabase
      .from("incidents")
      .select("id, severity, status")
      .eq("id", id)
      .single();
    if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

    if ((incident as { severity: string }).severity === "critical" && status === "resolved" && !admin.isSuperAdmin) {
      return NextResponse.json(
        { error: "CRITICAL incidents require superadmin to resolve" },
        { status: 403 }
      );
    }

    const meta = getAuditRequestMeta(req);
    await updateIncidentStatus({
      incidentId: id,
      status,
      admin_user_id: admin.userId,
      admin_email: admin.email,
      admin_role: admin.isSuperAdmin ? "superadmin" : "admin",
      is_sandbox: admin.isSandbox,
      reason,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 });
    if (msg.includes("already resolved")) return NextResponse.json({ error: msg }, { status: 400 });
    console.error("[admin/incidents/[id]] PATCH", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
