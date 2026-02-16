/**
 * GET /api/admin/analytics — platform health metrics (aggregated only).
 * Requires: authenticated admin, rate-limited, audit-logged. No PII, no per-user data.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  const userId = admin.userId ?? null;
  const rateLimitResult = withRateLimit(req, {
    userId,
    windowMs: 60_000,
    maxPerWindow: 60,
    prefix: "admin_analytics:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: userId ?? undefined,
    action: "VIEW_ADMIN_ANALYTICS",
    resource: "admin/analytics",
  });

  try {
    const supabase = getSupabaseServer();

    const [
      profilesRes,
      employersRes,
      activeSessionsRes,
      referencesRes,
      recordsRes,
      verifiedRecordsRes,
      locationsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase.from("site_sessions").select("user_id").gte("last_seen_at", THIRTY_DAYS_AGO).not("user_id", "is", null),
      supabase.from("employment_references").select("id", { count: "exact", head: true }),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).in("verification_status", ["verified", "matched"]).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("user_locations").select("country, state"),
    ]);

    const totalUsers = typeof profilesRes.count === "number" ? profilesRes.count : 0;
    const totalEmployers = typeof employersRes.count === "number" ? employersRes.count : 0;
    const activeUserIds = new Set((activeSessionsRes.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean));
    const activeUsers = activeUserIds.size;
    const totalReferences = typeof referencesRes.count === "number" ? referencesRes.count : 0;
    const totalRecords = typeof recordsRes.count === "number" ? recordsRes.count : 0;
    const verifiedRecords = typeof verifiedRecordsRes.count === "number" ? verifiedRecordsRes.count : 0;
    const verificationRate = totalRecords === 0 ? 0 : Math.round((verifiedRecords / totalRecords) * 100);

    const countries = new Set<string>();
    const statesWithCount = new Set<string>();
    for (const r of locationsRes.data ?? []) {
      const row = r as { country: string; state: string | null };
      if (row.country) countries.add(row.country);
      if (row.state?.trim()) statesWithCount.add(row.state.trim());
    }

    return NextResponse.json({
      totalUsers,
      totalEmployers,
      activeUsers,
      totalReferences,
      verificationRate,
      countriesActive: countries.size,
      statesActive: statesWithCount.size,
    });
  } catch (e) {
    console.error("[ADMIN ANALYTICS ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
