/**
 * GET /api/admin/alerts — list alerts. Admin only. Filter by is_sandbox, severity, category, status.
 * Uses service role (admin_alerts is RLS service-only).
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin.isAdmin) return adminForbiddenResponse();

  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
    const isSandboxParam = url.searchParams.get("is_sandbox")?.toLowerCase();
    const severity = url.searchParams.get("severity")?.trim();
    const category = url.searchParams.get("category")?.trim();
    const status = url.searchParams.get("status")?.trim();

    const supabase = getServiceRoleClient() as any;
    let query = supabase
      .from("admin_alerts")
      .select("id, category, alert_type, severity, title, summary, context, recommended_action, is_sandbox, status, acknowledged_by, acknowledged_at, dismissed_by, dismissed_at, silenced_until, escalation_count, source_ref, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (isSandboxParam === "true") query = query.eq("is_sandbox", true);
    if (isSandboxParam === "false") query = query.eq("is_sandbox", false);
    if (severity) query = query.eq("severity", severity);
    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      console.error("[admin/alerts]", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error("[admin/alerts]", e);
    return NextResponse.json([], { status: 200 });
  }
}
