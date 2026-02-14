/**
 * GET /api/admin/analytics/funnels — funnel conversion (landing → signup → profile, etc.).
 * Filterable by country, device, sandbox/prod. Admin-only. Audited.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAdminViewedAnalytics } from "@/lib/admin/analytics-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FUNNEL_STEPS: { name: string; paths: string[] }[] = [
  { name: "Landing", paths: ["/", "/careers", "/pricing", "/features", "/solutions"] },
  { name: "Signup", paths: ["/signup", "/signup/employee", "/signup/employer", "/auth/signup"] },
  { name: "Dashboard", paths: ["/dashboard", "/dashboard/worker", "/dashboard/employer"] },
  { name: "Profile", paths: ["/profile", "/dashboard/settings"] },
];

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    await logAdminViewedAnalytics(
      { userId: admin.userId, email: admin.user?.email ?? null, role: admin.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "funnels"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const envFilter = url.searchParams.get("env");
  const country = url.searchParams.get("country")?.trim();
  const device = url.searchParams.get("device")?.trim();
  const hours = Math.min(168, Math.max(1, parseInt(url.searchParams.get("hours") || "24", 10)));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const supabase = getSupabaseServer();

  let pvQuery = supabase
    .from("site_page_views")
    .select("session_id, path")
    .gte("created_at", since);
  if (envFilter === "sandbox") pvQuery = pvQuery.eq("is_sandbox", true);
  if (envFilter === "production") pvQuery = pvQuery.eq("is_sandbox", false);
  const { data: views } = await pvQuery.limit(50000);

  const sessionIds = [...new Set((views ?? []).map((v: { session_id: string | null }) => v.session_id).filter(Boolean))] as string[];
  let sessionMeta: { id: string; country: string | null; device_type: string | null }[] = [];
  if (sessionIds.length > 0) {
    let sQ = supabase.from("site_sessions").select("id, country, device_type").in("id", sessionIds.slice(0, 10000));
    const { data: sess } = await sQ;
    sessionMeta = (sess ?? []) as { id: string; country: string | null; device_type: string | null }[];
  }
  const bySession = Object.fromEntries(sessionMeta.map((s) => [s.id, s]));

  const pathMatches = (path: string, step: { paths: string[] }) =>
    step.paths.some((p) => path === p || path.startsWith(p + "/"));

  const sessionsWithPath: Record<string, Set<number>> = {};
  for (const v of views ?? []) {
    const sid = (v as { session_id: string | null }).session_id;
    const path = (v as { path: string }).path || "";
    if (!sid) continue;
    const meta = bySession[sid];
    if (country && (meta?.country ?? "") !== country) continue;
    if (device && (meta?.device_type ?? "") !== device) continue;
    for (let i = 0; i < FUNNEL_STEPS.length; i++) {
      if (pathMatches(path, FUNNEL_STEPS[i])) {
        if (!sessionsWithPath[sid]) sessionsWithPath[sid] = new Set();
        sessionsWithPath[sid].add(i);
      }
    }
  }

  const steps = FUNNEL_STEPS.map((step, i) => ({ name: step.name, order: i }));
  const converted = steps.map((_, i) => {
    let count = 0;
    for (const sids of Object.values(sessionsWithPath)) {
      let reached = true;
      for (let j = 0; j <= i; j++) if (!sids.has(j)) { reached = false; break; }
      if (reached) count++;
    }
    return count;
  });
  const entered = steps.map((_, i) => {
    let count = 0;
    for (const sids of Object.values(sessionsWithPath)) {
      if (sids.has(i)) count++;
    }
    return count;
  });

  return NextResponse.json({
    windowHours: hours,
    steps: steps.map((s, i) => ({
      name: s.name,
      entered: entered[i],
      converted: converted[i],
      dropOff: entered[i] > 0 ? (1 - converted[i] / entered[i]) * 100 : 0,
    })),
    filters: { country: country || null, device: device || null, env: envFilter || null },
  });
}
