/**
 * GET /api/admin/board — executive snapshot for board meetings. No tables, no PII.
 * Access: board | admin. Audit VIEW_BOARD_DASHBOARD, rate limit 60/min. Aggregated only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireBoardForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const DEFAULT_GROWTH = 0.05;

type PaymentRow = { amount_cents: number | null };
type SubscriptionRow = { monthly_amount_cents: number | null };

export async function GET(req: NextRequest) {
  const session = await requireBoardForApi();
  if (!session) return adminForbiddenResponse();

  const rateLimitResult = withRateLimit(req, {
    userId: session.userId,
    windowMs: 60_000,
    maxPerWindow: 60,
    prefix: "board:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: session.userId,
    action: "VIEW_BOARD_DASHBOARD",
    resource: "admin/board",
  });

  try {
    const supabase = getSupabaseServer();

    const [
      profilesRes,
      employersRes,
      sessionsRes,
      locationsRes,
      paymentsRes,
      activeSubsRes,
      canceledSubsRes,
      arpaSubsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase.from("site_sessions").select("user_id").gte("last_seen_at", SEVEN_DAYS_AGO).not("user_id", "is", null),
      supabase.from("user_locations").select("country, state"),
      supabase.from("finance_payments").select("amount_cents"),
      supabase.from("finance_subscriptions").select("monthly_amount_cents").eq("status", "active"),
      supabase.from("finance_subscriptions").select("id").eq("status", "canceled"),
      supabase.from("finance_subscriptions").select("monthly_amount_cents").eq("status", "active"),
    ]);

    const users = typeof profilesRes.count === "number" ? profilesRes.count : 0;
    const employers = typeof employersRes.count === "number" ? employersRes.count : 0;
    const weeklyActive = new Set((sessionsRes.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean)).size;

    const countries = new Set<string>();
    const statesSet = new Set<string>();
    for (const r of locationsRes.data ?? []) {
      const row = r as { country: string; state: string | null };
      if (row.country) countries.add(row.country);
      if (row.state?.trim()) statesSet.add(row.state.trim());
    }

    const payments: PaymentRow[] = (paymentsRes.data ?? []) as PaymentRow[];
    const totalRevenueCents = payments.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
    const totalRevenue = Math.round(totalRevenueCents / 100 * 100) / 100;

    const activeSubs: SubscriptionRow[] = (activeSubsRes.data ?? []) as SubscriptionRow[];
    const mrrCents = activeSubs.reduce((sum, row) => sum + (row.monthly_amount_cents ?? 0), 0);
    const MRR = Math.round(mrrCents / 100 * 100) / 100;
    const ARR = Math.round((mrrCents * 12) / 100 * 100) / 100;

    const growth = typeof process.env.FINANCE_MONTHLY_GROWTH_RATE === "string"
      ? parseFloat(process.env.FINANCE_MONTHLY_GROWTH_RATE) || DEFAULT_GROWTH
      : DEFAULT_GROWTH;
    const forecast = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      projectedMRR: Math.round(MRR * Math.pow(1 + growth, i) * 100) / 100,
    }));

    const canceled = (canceledSubsRes.data ?? []).length;
    const totalSubs = activeSubs.length + canceled;
    const churnRate = totalSubs === 0 ? 0 : Number((canceled / totalSubs).toFixed(3));
    const arpaRows: SubscriptionRow[] = (arpaSubsRes.data ?? []) as SubscriptionRow[];
    const arpaCents = activeSubs.length === 0 ? 0 : arpaRows.reduce((sum, row) => sum + (row.monthly_amount_cents ?? 0), 0) / activeSubs.length;
    const ARPA = Math.round(arpaCents / 100 * 100) / 100;
    const estimatedLTV = churnRate === 0 ? null : Math.round((ARPA / churnRate) * 100) / 100;

    return NextResponse.json({
      asOf: new Date().toISOString(),
      growth: {
        users,
        employers,
        weeklyActive,
      },
      revenue: {
        totalRevenue,
        MRR,
        ARR,
        forecast,
      },
      health: {
        churnRate,
        ARPA,
        estimatedLTV,
        activeSubscriptions: activeSubs.length,
      },
      expansion: {
        statesActive: statesSet.size,
        countriesActive: countries.size,
      },
    });
  } catch (e) {
    console.error("[BOARD API]", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
