/**
 * GET /api/admin/analytics — role-based platform metrics (aggregated only).
 * Query: ?view=admin|sales|marketing|ops|support|finance. Auth, role, rate limit, audit. 404 when feature disabled.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";
import {
  getAnalyticsRole,
  canAccessView,
  getDefaultView,
  getAllowedViews,
  type AnalyticsView,
} from "@/lib/admin/analytics-role";
import {
  getAnalyticsFeatureFlags,
  isViewAllowedByFlags,
} from "@/lib/admin/analytics-feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const ONE_DAY_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

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

  const profileRole = (admin.profile as { role?: string | null })?.role ?? null;
  const analyticsRole = getAnalyticsRole(profileRole);
  const url = new URL(req.url);
  const requestedView = (url.searchParams.get("view") ?? "").trim().toLowerCase() || getDefaultView(analyticsRole);
  const view: AnalyticsView = requestedView as AnalyticsView;

  if (!canAccessView(analyticsRole, view)) {
    return NextResponse.json({ error: "Forbidden", message: "View not allowed for your role" }, { status: 403 });
  }

  const flags = getAnalyticsFeatureFlags();
  if (!isViewAllowedByFlags(view, flags)) {
    return NextResponse.json({ error: "Not Found", message: "Feature not available" }, { status: 404 });
  }

  await logAudit({
    actorId: userId ?? undefined,
    action: "VIEW_ADMIN_ANALYTICS",
    resource: `admin/analytics:${view}`,
  });

  try {
    const supabase = getSupabaseServer();

    const [
      profilesRes,
      employersRes,
      employersPrevRes,
      activeSessionsRes,
      referencesRes,
      recordsRes,
      verifiedRecordsRes,
      locationsRes,
      newUsers1dRes,
      newUsers7dRes,
      employersActiveRes,
      activatedUsersRes,
      orgsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }).lt("created_at", THIRTY_DAYS_AGO),
      supabase.from("site_sessions").select("user_id").gte("last_seen_at", THIRTY_DAYS_AGO).not("user_id", "is", null),
      supabase.from("employment_references").select("id", { count: "exact", head: true }),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).in("verification_status", ["verified", "matched"]).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("user_locations").select("country, state"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", ONE_DAY_AGO).is("deleted_at", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", SEVEN_DAYS_AGO).is("deleted_at", null),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }).gte("updated_at", THIRTY_DAYS_AGO),
      supabase.from("employment_references").select("reviewed_user_id"),
      supabase.from("organizations").select("id", { count: "exact", head: true }),
    ]);

    const totalUsers = typeof profilesRes.count === "number" ? profilesRes.count : 0;
    const totalEmployers = typeof employersRes.count === "number" ? employersRes.count : 0;
    const employersPrev = typeof employersPrevRes.count === "number" ? employersPrevRes.count : 0;
    const employerGrowthRate = employersPrev === 0 ? (totalEmployers > 0 ? 100 : 0) : Math.round(((totalEmployers - employersPrev) / employersPrev) * 100);
    const activeUserIds = new Set((activeSessionsRes.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean));
    const activeUsers = activeUserIds.size;
    const totalReferences = typeof referencesRes.count === "number" ? referencesRes.count : 0;
    const totalRecords = typeof recordsRes.count === "number" ? recordsRes.count : 0;
    const verifiedRecords = typeof verifiedRecordsRes.count === "number" ? verifiedRecordsRes.count : 0;
    const verificationRate = totalRecords === 0 ? 0 : Math.round((verifiedRecords / totalRecords) * 100);
    const newUsersDaily = typeof newUsers1dRes.count === "number" ? newUsers1dRes.count : 0;
    const newUsersWeekly = typeof newUsers7dRes.count === "number" ? newUsers7dRes.count : 0;
    const queueSize = Math.max(0, totalRecords - verifiedRecords);
    const activeEmployers = typeof employersActiveRes.count === "number" ? employersActiveRes.count : 0;
    const activatedUserIds = new Set((activatedUsersRes.data ?? []).map((r: { reviewed_user_id: string | null }) => r.reviewed_user_id).filter(Boolean));
    const activationRate = totalUsers === 0 ? 0 : Math.round((activatedUserIds.size / totalUsers) * 100);
    const employerPlansCount = typeof orgsRes.count === "number" ? orgsRes.count : 0;

    const countries = new Set<string>();
    const statesWithCount = new Set<string>();
    for (const r of locationsRes.data ?? []) {
      const row = r as { country: string; state: string | null };
      if (row.country) countries.add(row.country);
      if (row.state?.trim()) statesWithCount.add(row.state.trim());
    }

    const allowedViews = getAllowedViews(analyticsRole);
    const base = { view, allowedViews };

    switch (view) {
      case "admin":
        return NextResponse.json({
          ...base,
          totalUsers,
          totalEmployers,
          activeUsers,
          totalReferences,
          verificationRate,
          countriesActive: countries.size,
          statesActive: statesWithCount.size,
        });
      case "sales":
        return NextResponse.json({
          ...base,
          totalEmployers,
          activeEmployers,
          employerGrowthRate,
          regionsWithEmployerActivity: countries.size,
          statesActive: statesWithCount.size,
        });
      case "marketing":
        return NextResponse.json({
          ...base,
          newUsersDaily,
          newUsersWeekly,
          activationRate,
          referralVolume: 0,
          countriesActive: countries.size,
          statesActive: statesWithCount.size,
        });
      case "ops":
        return NextResponse.json({
          ...base,
          totalReferences,
          verificationRate,
          queueSize,
          timeToVerifyDays: null,
        });
      case "support":
        return NextResponse.json({
          ...base,
          ticketVolume: 0,
          resolutionTimeHoursAvg: null,
          escalationRate: 0,
        });
      case "finance":
        return NextResponse.json({
          ...base,
          employerPlansCount,
          revenueTotal: null,
          mrr: null,
          arr: null,
        });
      default:
        return NextResponse.json({ ...base, totalUsers, totalEmployers, activeUsers, totalReferences, verificationRate, countriesActive: countries.size, statesActive: statesWithCount.size });
    }
  } catch (e) {
    console.error("[ADMIN ANALYTICS ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
