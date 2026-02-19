/**
 * GET /api/admin/financials/health — churn, LTV, ARPA (investor-critical).
 * Access: finance | admin | board. Audit VIEW_CHURN_LTV, rate limit 60/min. Aggregated only.
 * Churn = canceled / (active + canceled). LTV = ARPA / churn_rate.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFinanceForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await requireFinanceForApi();
  if (!session) return adminForbiddenResponse();

  const rateLimitResult = withRateLimit(req, {
    userId: session.userId,
    windowMs: 60_000,
    maxPerWindow: 60,
    prefix: "finance_health:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: session.userId,
    action: "VIEW_CHURN_LTV",
    resource: "admin/financials/health",
  });

  try {
    const supabase = getSupabaseServer();

    const [activeRes, canceledRes, arpaRes] = await Promise.all([
      supabase.from("finance_subscriptions").select("id, monthly_amount_cents").eq("status", "active"),
      supabase.from("finance_subscriptions").select("id").eq("status", "canceled"),
      supabase.from("finance_subscriptions").select("monthly_amount_cents").eq("status", "active"),
    ]);

    const active = (activeRes.data ?? []).length;
    const canceled = (canceledRes.data ?? []).length;
    const total = active + canceled;
    const churnRate = total === 0 ? 0 : canceled / total;

    type SubscriptionRow = { monthly_amount_cents: number | null };
    const arpaRows: SubscriptionRow[] = (arpaRes.data ?? []) as SubscriptionRow[];
    const sumCents = arpaRows.reduce((sum, row) => sum + (row.monthly_amount_cents ?? 0), 0);
    const arpaCents = active === 0 ? 0 : sumCents / active;
    const ARPA = Math.round(arpaCents / 100 * 100) / 100;
    const estimatedLTV = churnRate === 0 ? null : Math.round((ARPA / churnRate) * 100) / 100;

    return NextResponse.json({
      activeSubscriptions: active,
      churnRate: Number(churnRate.toFixed(3)),
      ARPA,
      estimatedLTV,
    });
  } catch (e) {
    console.error("[FINANCIALS HEALTH]", e);
    return NextResponse.json({
      activeSubscriptions: 0,
      churnRate: 0,
      ARPA: 0,
      estimatedLTV: null,
    }, { status: 200 });
  }
}
