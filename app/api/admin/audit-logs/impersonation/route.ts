/**
 * GET /api/admin/audit-logs/impersonation — read-only impersonation_audit. SOC-2.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin.isAdmin) return adminForbiddenResponse();

  try {
    const url = new URL(req.url);
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
    const adminId = url.searchParams.get("admin_user_id")?.trim() || undefined;
    const environment = url.searchParams.get("environment")?.trim() || undefined;

    const supabase = getServiceRoleClient();
    let query = supabase
      .from("impersonation_audit")
      .select("id, admin_user_id, admin_email, target_user_id, target_identifier, event, environment, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (adminId) query = query.eq("admin_user_id", adminId);
    if (environment) query = query.eq("environment", environment);

    const { data, error } = await query;

    if (error) {
      console.error("[admin/audit-logs/impersonation]", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("[admin/audit-logs/impersonation]", e);
    return NextResponse.json([], { status: 200 });
  }
}
