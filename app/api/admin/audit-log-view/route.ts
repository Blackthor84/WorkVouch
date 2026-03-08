// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/admin/audit-log-view — read from admin_audit_log_view. Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const adminContext = await getAdminContext(req);
  if (!adminContext.isAdmin) return adminForbiddenResponse();

  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") ?? "200", 10)));

  const supabase = admin as any;
  const { data, error } = await admin.from("admin_audit_log_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin/audit-log-view]", error);
    return NextResponse.json({ error: "Failed to load audit log" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
