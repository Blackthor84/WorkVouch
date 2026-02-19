/**
 * GET /api/admin/analytics/journeys — user/session journey timeline.
 * Query: session_id= or user_id=. Returns page views, events, errors; no PII.
 * Admin-only. Audited.
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
      { userId: admin.userId, email: admin.user?.email ?? null, role: admin.isSuperAdmin ? "super_admin" : "admin" },
      req,
      "journeys"
    );
  } catch (_) {}

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  const userId = url.searchParams.get("user_id")?.trim();

  if (!sessionId && !userId) {
    return NextResponse.json({ error: "Provide session_id or user_id" }, { status: 400 });
  }

  const supabase = getSupabaseServer() as any;
  let sessionIds: string[] = [];
  let sessionMeta: { id: string; country: string | null; device_type: string | null; is_sandbox: boolean; started_at: string; last_seen_at: string } | null = null;

  if (sessionId) {
    const { data: sess } = await supabase
      .from("site_sessions")
      .select("id, country, device_type, is_sandbox, started_at, last_seen_at")
      .eq("id", sessionId)
      .maybeSingle();
    if (!sess) {
      return NextResponse.json({ error: "Session not found", timeline: [], session: null }, { status: 200 });
    }
    sessionMeta = sess;
    sessionIds = [sessionId];
  } else if (userId) {
    const { data: sessions } = await supabase
      .from("site_sessions")
      .select("id, country, device_type, is_sandbox, started_at, last_seen_at")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(10);
    if (!sessions?.length) {
      return NextResponse.json({ error: "No sessions found for user", timeline: [], session: null }, { status: 200 });
    }
    sessionMeta = sessions[0];
    sessionIds = sessions.map((s: { id: string }) => s.id);
  }

  const [pvRes, evRes] = await Promise.all([
    supabase
      .from("site_page_views")
      .select("id, path, referrer, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("site_events")
      .select("id, event_type, event_metadata, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true }),
  ]);

  const pageViews = (pvRes.data ?? []).map((r: { id: string; path: string; referrer: string | null; created_at: string }) => ({
    type: "page_view" as const,
    at: r.created_at,
    path: r.path,
    referrer: r.referrer ?? undefined,
  }));
  const events = (evRes.data ?? []).map((r: { id: string; event_type: string; event_metadata: unknown; created_at: string }) => ({
    type: "event" as const,
    at: r.created_at,
    event_type: r.event_type,
    metadata: r.event_metadata ?? undefined,
  }));

  const timeline = [...pageViews, ...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  return NextResponse.json({
    session: sessionMeta,
    timeline,
    trust_score_at_visit: null,
  });
}
