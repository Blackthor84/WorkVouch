import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getAdminRole } from "@/lib/admin";
import { AdminRole } from "@/lib/permissions";
import { getRequestId } from "@/lib/requestContext";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

/** GET: SOC-2 export only. ?type=soc2. Read-only, auditable. Other types return 400. */
export async function GET(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin || !admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const requestId = getRequestId(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "";

    if (type !== "soc2") {
      return NextResponse.json(
        { error: "Bad request. Only type=soc2 is supported." },
        { status: 400 }
      );
    }

    const email = admin.email;
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = await getAdminRole(email);
    if (role !== AdminRole.PLATFORM_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("admin_id, action, target_user_id, new_value, created_at")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) {
      console.error("[ADMIN_EXPORT]", { requestId, error: error.message });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const rows = (data ?? []).map((r: Record<string, unknown>) => {
      const nv = (r.new_value ?? {}) as Record<string, unknown>;
      return {
        admin_id: r.admin_id,
        created_at: r.created_at,
        action: r.action,
        target_type: nv.target_type ?? "",
        target_id: nv.target_id ?? r.target_user_id ?? "",
        impersonation_used:
          nv.impersonation_context != null &&
          nv.impersonation_context !== ""
            ? "yes"
            : "no",
      };
    });
    const csv = toCSV(rows);

    logAdminAction({
      adminId: admin.userId,
      action: "EXPORT",
      resource: "SOC2",
      requestId,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          "attachment; filename=admin-access-soc2-report.csv",
      },
    });
  } catch (err) {
    console.error("[ADMIN_API_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys
    .map((k) => `"${String(k).replace(/"/g, '""')}"`)
    .join(",");
  const body = rows
    .map((r) =>
      keys
        .map((k) =>
          `"${String(r[k] ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");
  return header + "\n" + body;
}
