/**
 * GET /api/admin/analytics/overview — internal analytics (enterprise schema).
 * Uses site_sessions + site_page_views. Admin-only. Audited. Sandbox-aware.
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
      "overview"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const envFilter = url.searchParams.get("env");
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseServer();

  let sessionsQuery = supabase.from("site_sessions").select("id, last_seen_at").gte("last_seen_at", fiveMinAgo);
  if (envFilter === "sandbox") sessionsQuery = sessionsQuery.eq("is_sandbox", true);
  if (envFilter === "production") sessionsQuery = sessionsQuery.eq("is_sandbox", false);
  const { data: activeSessions } = await sessionsQuery.limit(5000);
  const realTimeVisitors = activeSessions?.length ?? 0;

  let pvQuery = supabase
    .from("site_page_views")
    .select("session_id, path, is_sandbox")
    .gte("created_at", oneDayAgo)
    .limit(10000);
  if (envFilter === "sandbox") pvQuery = pvQuery.eq("is_sandbox", true);
  if (envFilter === "production") pvQuery = pvQuery.eq("is_sandbox", false);
  const { data: views24h } = await pvQuery;

  const sessionIds = [...new Set((views24h ?? []).map((v: { session_id: string | null }) => v.session_id).filter(Boolean))] as string[];
  let countryBySession: Record<string, string> = {};
  if (sessionIds.length > 0) {
    const { data: sessRows } = await supabase.from("site_sessions").select("id, country").in("id", sessionIds.slice(0, 5000));
    for (const r of sessRows ?? []) {
      countryBySession[r.id] = (r as { country: string | null }).country ?? "unknown";
    }
  }

  const sandboxCount = views24h?.filter((v: { is_sandbox: boolean }) => v.is_sandbox).length ?? 0;
  const prodCount = views24h?.filter((v: { is_sandbox: boolean }) => !v.is_sandbox).length ?? 0;
  const byPath: Record<string, { views: number; sessions: Set<string | null> }> = {};
  const byCountry: Record<string, number> = {};
  for (const v of views24h ?? []) {
    const path = (v as { path: string }).path || "/";
    if (!byPath[path]) byPath[path] = { views: 0, sessions: new Set() };
    byPath[path].views++;
    byPath[path].sessions.add((v as { session_id: string | null }).session_id);
    const sid = (v as { session_id: string | null }).session_id;
    const country = sid ? countryBySession[sid] ?? "unknown" : "unknown";
    byCountry[country] = (byCountry[country] ?? 0) + 1;
  }

  const pagePerformance = Object.entries(byPath)
    .map(([path, data]) => ({ path, views: data.views, uniqueSessions: data.sessions.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 50);
  const visitorMap = Object.entries(byCountry)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  return NextResponse.json({
    realTimeVisitors,
    last24h: {
      totalViews: views24h?.length ?? 0,
      uniqueSessions: sessionIds.length,
      sandboxViews: sandboxCount,
      productionViews: prodCount,
    },
    pagePerformance,
    visitorMap,
  });
}
