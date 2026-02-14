/**
 * GET /api/admin/incidents/export — export incidents as JSON or CSV. Admin only. Audited (EXPORT_INCIDENTS).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { listIncidents } from "@/lib/admin/incidents";
import { writeAdminAuditLog } from "@/lib/admin/audit-enterprise";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext();
    if (!admin.isAdmin) return adminForbiddenResponse();

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";
    const environment = url.searchParams.get("environment") as "prod" | "sandbox" | undefined;
    const status = url.searchParams.get("status") as "open" | "mitigated" | "resolved" | undefined;
    const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get("limit") || "500", 10)));

    const incidents = await listIncidents({ environment, status, limit });
    const meta = getAuditRequestMeta(req);

    await writeAdminAuditLog({
      admin_user_id: admin.userId,
      admin_email: admin.email,
      admin_role: admin.isSuperAdmin ? "superadmin" : "admin",
      action_type: "EXPORT_INCIDENTS",
      target_type: "system",
      target_id: null,
      before_state: null,
      after_state: { format, count: incidents.length, environment: environment ?? "all", status: status ?? "all" },
      reason: `Exported ${incidents.length} incidents (${format})`,
      is_sandbox: admin.isSandbox,
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
    });

    if (format === "csv") {
      const header = "id,incident_type,severity,title,environment,status,detected_at,mitigated_at,resolved_at,affected_users,affected_employers,created_at\n";
      const rows = incidents.map(
        (i) =>
          `${i.id},${escapeCsv(i.incident_type)},${escapeCsv(i.severity)},${escapeCsv(i.title)},${i.environment},${i.status},${i.detected_at},${i.mitigated_at ?? ""},${i.resolved_at ?? ""},${i.affected_users ?? ""},${i.affected_employers ?? ""},${i.created_at}`
      );
      const csv = header + rows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="incidents-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      count: incidents.length,
      filters: { environment: environment ?? "all", status: status ?? "all" },
      incidents,
    });
  } catch (e) {
    console.error("[admin/incidents/export]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

function escapeCsv(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
