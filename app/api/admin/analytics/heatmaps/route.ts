/**
 * GET /api/admin/analytics/heatmaps — click density & scroll depth (privacy-safe, no PII).
 * event_type: click | scroll_depth. event_metadata: path, x_bucket, y_bucket or depth_pct.
 * Admin-only. Audited. Sampling allowed for heatmaps only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAdminViewedAnalytics } from "@/lib/admin/analytics-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    await logAdminViewedAnalytics(
      { userId: admin.authUserId, email: admin.user?.email ?? null, role: admin.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "heatmaps"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const path = url.searchParams.get("path")?.trim();
  const kind = url.searchParams.get("kind") || "click"; // click | scroll_depth
  const envFilter = url.searchParams.get("env");
  const hours = Math.min(168, Math.max(1, parseInt(url.searchParams.get("hours") || "24", 10)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  let q = getSupabaseServer()
    .from("site_events")
    .select("event_type, event_metadata")
    .eq("event_type", kind === "scroll_depth" ? "scroll_depth" : "click")
    .gte("created_at", since)
    .limit(5000);
  if (envFilter === "sandbox") q = q.eq("is_sandbox", true);
  if (envFilter === "production") q = q.eq("is_sandbox", false);
  const { data: events } = await q;

  const buckets: Record<string, number> = {};
  for (const e of events ?? []) {
    const meta = (e as { event_metadata?: { path?: string; x_bucket?: number; y_bucket?: number; depth_pct?: number } }).event_metadata;
    if (!meta || typeof meta !== "object") continue;
    const p = (meta as { path?: string }).path;
    if (path && p !== path) continue;
    const key = kind === "scroll_depth"
      ? `scroll_${p ?? ""}_${(meta as { depth_pct?: number }).depth_pct ?? 0}`
      : `click_${p ?? ""}_${(meta as { x_bucket?: number }).x_bucket ?? 0}_${(meta as { y_bucket?: number }).y_bucket ?? 0}`;
    buckets[key] = (buckets[key] ?? 0) + 1;
  }

  const heatmap = Object.entries(buckets).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    kind,
    path: path || null,
    windowHours: hours,
    heatmap,
    message: "Client must send click/scroll_depth events via POST /api/analytics/event with event_metadata path, x_bucket/y_bucket or depth_pct.",
  });
}
