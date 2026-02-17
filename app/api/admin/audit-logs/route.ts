/**
 * GET /api/admin/audit-logs — read-only audit log from admin_audit_logs.
 * Filters: admin_id, action, is_sandbox (true|false|all). Every admin action is logged here.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext(req);
    if (!admin.isAdmin) return adminForbiddenResponse();

    const url = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
    const adminId = url.searchParams.get("admin_id")?.trim() || url.searchParams.get("admin_user_id")?.trim() || undefined;
    const action = url.searchParams.get("action")?.trim() || undefined;
    const isSandboxParam = url.searchParams.get("is_sandbox")?.toLowerCase();

    const supabase = getSupabaseServer() as any;
    let query = supabase
      .from("admin_audit_logs")
      .select("id, admin_user_id, admin_email, admin_role, action_type, target_type, target_id, before_state, after_state, reason, is_sandbox, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (adminId) query = query.eq("admin_user_id", adminId);
    if (action) query = query.eq("action_type", action);
    if (isSandboxParam === "true") query = query.eq("is_sandbox", true);
    if (isSandboxParam === "false") query = query.eq("is_sandbox", false);

    const { data, error } = await query;

    if (error) {
      console.error("[admin/audit-logs]", error);
      return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[admin/audit-logs]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
