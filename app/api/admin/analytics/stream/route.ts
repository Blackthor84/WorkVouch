/**
 * GET /api/admin/analytics/stream — Server-Sent Events for real-time analytics.
 * Admin-only. Streams active visitors, recent page views, sandbox vs prod. Audited once on connect.
 */

import { NextRequest } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAdminViewedAnalytics } from "@/lib/admin/analytics-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INTERVAL_MS = 4000;

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    await logAdminViewedAnalytics(
      { userId: admin.userId, email: admin.user?.email ?? null, role: admin.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "realtime-stream"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const envFilter = url.searchParams.get("env");
  const fiveMinAgo = () => new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        try {
          const since = fiveMinAgo();
          let sessQ = getSupabaseServer().from("site_sessions").select("id").gte("last_seen_at", since).limit(5000);
          if (envFilter === "sandbox") sessQ = sessQ.eq("is_sandbox", true);
          if (envFilter === "production") sessQ = sessQ.eq("is_sandbox", false);
          const { data: activeRows } = await sessQ;
          const active = activeRows?.length ?? 0;

          let pvQ = getSupabaseServer()
            .from("site_page_views")
            .select("id, path, is_sandbox, created_at")
            .order("created_at", { ascending: false })
            .limit(20);
          if (envFilter === "sandbox") pvQ = pvQ.eq("is_sandbox", true);
          if (envFilter === "production") pvQ = pvQ.eq("is_sandbox", false);
          const { data: recentViews } = await pvQ;

          const [sandboxRes, prodRes] = await Promise.all([
            getSupabaseServer().from("site_sessions").select("id").gte("last_seen_at", since).eq("is_sandbox", true).limit(5000),
            getSupabaseServer().from("site_sessions").select("id").gte("last_seen_at", since).eq("is_sandbox", false).limit(5000),
          ]);
          const sandbox = sandboxRes.data?.length ?? 0;
          const prod = prodRes.data?.length ?? 0;

          send({
            ts: Date.now(),
            activeVisitors: active,
            sandboxActive: sandbox,
            productionActive: prod,
            recentPageViews: (recentViews ?? []).map((r: { path: string; is_sandbox: boolean; created_at: string }) => ({
              path: r.path,
              is_sandbox: r.is_sandbox,
              at: r.created_at,
            })),
          });
        } catch (e) {
          send({ error: "query failed" });
        }
      };

      await tick();
      const id = setInterval(tick, INTERVAL_MS);
      req.signal?.addEventListener?.("abort", () => {
        clearInterval(id);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache",
      Connection: "keep-alive",
    },
  });
}
