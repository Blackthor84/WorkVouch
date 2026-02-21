/**
 * GET /api/admin/analytics/abuse — list abuse signals. Admin-only. Audited.
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
      "abuse"
    );
  } catch (_) {}

  try {
  const url = new URL(req.url);
  const envFilter = url.searchParams.get("env");
  const signalType = url.searchParams.get("signal_type")?.trim();
  const hours = Math.min(720, Math.max(1, parseInt(url.searchParams.get("hours") || "24", 10)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));

  let q = getSupabaseServer()
    .from("abuse_signals")
    .select("id, session_id, signal_type, severity, metadata, is_sandbox, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (envFilter === "sandbox") q = q.eq("is_sandbox", true);
  if (envFilter === "production") q = q.eq("is_sandbox", false);
  if (signalType) q = q.eq("signal_type", signalType);
  const { data: signals, error } = await q;

  if (error) {
    console.error("[admin/analytics/abuse]", error);
    return NextResponse.json({ windowHours: 24, signals: [], bySignalType: [] }, { status: 200 });
  }

  let byType: Record<string, number> = {};
  for (const s of signals ?? []) {
    const t = (s as { signal_type: string }).signal_type || "unknown";
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return NextResponse.json({
    windowHours: hours,
    signals: signals ?? [],
    bySignalType: Object.entries(byType).map(([type, count]) => ({ type, count })),
  });
  } catch (e) {
    console.error("[admin/analytics/abuse]", e);
    return NextResponse.json({ windowHours: 24, signals: [], bySignalType: [] }, { status: 200 });
  }
}
