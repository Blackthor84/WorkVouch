// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/admin/analytics/real-time — active visitors (unique sessions in last N minutes).
 * Admin-only. Audited.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { admin } from "@/lib/supabase-admin";
import { logAdminViewedAnalytics } from "@/lib/admin/analytics-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const adminSession = await requireAdminForApi();
  if (!adminSession) return adminForbiddenResponse();

  try {
    await logAdminViewedAnalytics(
      { userId: adminSession.authUserId, authUserId: adminSession.authUserId, email: adminSession.user?.email ?? null, role: adminSession.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "real-time"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const minutes = Math.min(60, Math.max(1, parseInt(url.searchParams.get("minutes") || "5", 10)));
  const envFilter = url.searchParams.get("env");

  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  let q = admin.from("site_sessions").select("id").gte("last_seen_at", since).limit(10000);
  if (envFilter === "sandbox") q = q.eq("is_sandbox", true);
  if (envFilter === "production") q = q.eq("is_sandbox", false);
  const { data: rows } = await q;
  const activeVisitors = rows?.length ?? 0;
  return NextResponse.json({ activeVisitors, windowMinutes: minutes });
}
