/**
 * GET /api/admin/analytics/real-time — active visitors (unique sessions in last N minutes).
 * Admin-only. Audited.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAdminViewedAnalytics } from "@/lib/admin/analytics-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    await logAdminViewedAnalytics(
      { userId: admin.userId, email: admin.user?.email ?? null, role: admin.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "real-time"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const minutes = Math.min(60, Math.max(1, parseInt(url.searchParams.get("minutes") || "5", 10)));
  const envFilter = url.searchParams.get("env");

  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  let q = getSupabaseServer().from("site_sessions").select("id").gte("last_seen_at", since).limit(10000);
  if (envFilter === "sandbox") q = q.eq("is_sandbox", true);
  if (envFilter === "production") q = q.eq("is_sandbox", false);
  const { data: rows } = await q;
  const activeVisitors = rows?.length ?? 0;
  return NextResponse.json({ activeVisitors, windowMinutes: minutes });
}
