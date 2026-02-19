/**
 * GET /api/admin/analytics/errors — error event rates from site_events.
 * Admin-only. Events named error_* or with event_name containing 'error' (no PII in metadata).
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
      "errors"
    );
  } catch (_) {}

  try {
  const url = new URL(req.url);
  const hours = Math.min(168, Math.max(1, parseInt(url.searchParams.get("hours") || "24", 10)));
  const envFilter = url.searchParams.get("env");
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let q = getSupabaseServer()
    .from("site_events")
    .select("id, event_type, created_at")
    .gte("created_at", since)
    .ilike("event_type", "%error%")
    .limit(500);
  if (envFilter === "sandbox") q = q.eq("is_sandbox", true);
  if (envFilter === "production") q = q.eq("is_sandbox", false);
  const { data: errorEvents } = await q;

  let pvQuery = getSupabaseServer().from("site_page_views").select("id").gte("created_at", since).limit(50000);
  if (envFilter === "sandbox") pvQuery = pvQuery.eq("is_sandbox", true);
  if (envFilter === "production") pvQuery = pvQuery.eq("is_sandbox", false);
  const { data: pvRows } = await pvQuery;
  const totalViews = pvRows?.length ?? 0;

  const byName: Record<string, number> = {};
  for (const e of errorEvents ?? []) {
    const name = (e as { event_type: string }).event_type || "unknown";
    byName[name] = (byName[name] ?? 0) + 1;
  }

  return NextResponse.json({
    windowHours: hours,
    totalErrorEvents: errorEvents?.length ?? 0,
    totalPageViews: totalViews,
    errorRate: totalViews ? ((errorEvents?.length ?? 0) / totalViews) * 100 : 0,
    byEventName: Object.entries(byName).map(([name, count]) => ({ name, count })),
  });
  } catch (e) {
    console.error("[admin/analytics/errors]", e);
    return NextResponse.json({
      windowHours: 24,
      totalErrorEvents: 0,
      totalPageViews: 0,
      errorRate: 0,
      byEventName: [],
    }, { status: 200 });
  }
}
