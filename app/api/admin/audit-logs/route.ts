/**
 * GET /api/admin/audit-logs — read-only audit log (admin/super_admin).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext();
    if (!admin.isAdmin) return adminForbiddenResponse();

    const url = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));

    const supabase = getSupabaseServer() as any;
    const { data, error } = await supabase
      .from("system_audit_logs")
      .select("id, actor_user_id, actor_role, action, target_user_id, metadata, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

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
