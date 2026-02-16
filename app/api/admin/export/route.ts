import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getAdminRole } from "@/lib/admin";
import { AdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const EXPORT_TYPES = ["users", "peer_reviews", "fraud_flags", "employment", "audit_logs", "impersonation_audit", "soc2"] as const;

/** GET: export data as CSV. ?type=users|peer_reviews|fraud_flags|employment|audit_logs|impersonation_audit|soc2. Unknown/missing type returns stub. */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminForApi();
    if (!session) return adminForbiddenResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "unknown";
    if (!EXPORT_TYPES.includes(type as (typeof EXPORT_TYPES)[number])) {
      return Response.json({
        success: true,
        exportType: type,
        message: "Export endpoint operational (stub)",
      });
    }

    const supabase = getSupabaseServer();

    if (type === "soc2") {
      const role = await getAdminRole(session.user.email as string);
      if (role !== AdminRole.PLATFORM_ADMIN) {
        return NextResponse.json({ error: "SOC-2 reports are available to platform admins only" }, { status: 403 });
      }
      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("admin_id, action, target_user_id, new_value, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const rows = (data ?? []).map((r: Record<string, unknown>) => {
        const nv = (r.new_value ?? {}) as Record<string, unknown>;
        return {
          admin_id: r.admin_id,
          created_at: r.created_at,
          action: r.action,
          target_type: nv.target_type ?? "",
          target_id: nv.target_id ?? r.target_user_id ?? "",
          impersonation_used: nv.impersonation_context != null && nv.impersonation_context !== "" ? "yes" : "no",
        };
      });
      const csv = toCSV(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=admin-access-soc2-report.csv",
        },
      });
    }

    if (type === "users") {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, role, industry, status, risk_level, flagged_for_fraud, created_at").order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const rows = (data ?? []) as Record<string, unknown>[];
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=users.csv" } });
    }

    if (type === "peer_reviews") {
      const { data, error } = await supabase.from("employment_references").select("id, employment_match_id, reviewer_id, reviewed_user_id, rating, comment, created_at").order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const csv = toCSV((data ?? []) as Record<string, unknown>[]);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=peer_reviews.csv" } });
    }

    if (type === "fraud_flags") {
      const { data, error } = await supabase.from("fraud_signals").select("id, user_id, signal_type, metadata, created_at").order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const csv = toCSV((data ?? []) as Record<string, unknown>[]);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=fraud_signals.csv" } });
    }

    if (type === "employment") {
      const { data, error } = await supabase.from("employment_records").select("id, user_id, company_name, job_title, start_date, end_date, verification_status, created_at").order("created_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const csv = toCSV((data ?? []) as Record<string, unknown>[]);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=employment_records.csv" } });
    }

    if (type === "audit_logs") {
      const { data, error } = await supabase.from("admin_audit_logs").select("id, admin_user_id, admin_email, admin_role, action_type, target_type, target_id, before_state, after_state, reason, is_sandbox, ip_address, user_agent, created_at").order("created_at", { ascending: false }).limit(10000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({ ...r, before_state: JSON.stringify(r.before_state), after_state: JSON.stringify(r.after_state) }));
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=audit_logs.csv" } });
    }

    if (type === "impersonation_audit") {
      const { data, error } = await supabase.from("impersonation_audit").select("id, admin_user_id, admin_email, target_user_id, target_identifier, event, environment, ip_address, user_agent, created_at").order("created_at", { ascending: false }).limit(10000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const csv = toCSV((data ?? []) as Record<string, unknown>[]);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=impersonation_audit.csv" } });
    }

    return Response.json({
      success: true,
      exportType: type,
      message: "Export endpoint operational (stub)",
    });
  } catch (e) {
    console.error("Admin export error:", e);
    const msg = e instanceof Error ? e.message : "Internal error";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.map((k) => `"${String(k).replace(/"/g, '""')}"`).join(",");
  const body = rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  return header + "\n" + body;
}
