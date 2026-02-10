import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";

/** GET: export data as CSV. ?type=users|peer_reviews|fraud_flags|employment|audit_logs */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "users";
    const supabase = getSupabaseServer();

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
      const { data, error } = await supabase.from("admin_audit_logs").select("id, admin_id, target_user_id, action, old_value, new_value, reason, created_at").order("created_at", { ascending: false }).limit(10000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const rows = (data ?? []).map((r: Record<string, unknown>) => ({ ...r, old_value: JSON.stringify(r.old_value), new_value: JSON.stringify(r.new_value) }));
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=audit_logs.csv" } });
    }

    return NextResponse.json({ error: "Invalid type. Use users|peer_reviews|fraud_flags|employment|audit_logs" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.map((k) => `"${String(k).replace(/"/g, '""')}"`).join(",");
  const body = rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  return header + "\n" + body;
}
