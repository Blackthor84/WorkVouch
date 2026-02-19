/**
 * GET /api/admin/financials/forecast — 12-month MRR projection (trend-based).
 * Access: finance | admin | board. Audit VIEW_FORECAST, rate limit 60/min. Aggregated only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFinanceForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/soc2-audit";
import { withRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_MONTHLY_GROWTH_RATE = 0.05;

export async function GET(req: NextRequest) {
  const session = await requireFinanceForApi();
  if (!session) return adminForbiddenResponse();

  const rateLimitResult = withRateLimit(req, {
    userId: session.userId,
    windowMs: 60_000,
    maxPerWindow: 60,
    prefix: "finance_forecast:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: session.userId,
    action: "VIEW_FORECAST",
    resource: "admin/financials/forecast",
  });

  try {
    const supabase = getSupabaseServer();
    const { data: activeSubsData } = await supabase
      .from("finance_subscriptions")
      .select("monthly_amount_cents")
      .eq("status", "active");

    type SubscriptionRow = { monthly_amount_cents: number | null };
    const subs: SubscriptionRow[] = (activeSubsData ?? []) as SubscriptionRow[];
    const currentMRRCents = subs.reduce((sum, row) => sum + (row.monthly_amount_cents ?? 0), 0);
    const currentMRR = Math.round(currentMRRCents / 100 * 100) / 100;

    const monthlyGrowthRate =
      typeof process.env.FINANCE_MONTHLY_GROWTH_RATE === "string"
        ? parseFloat(process.env.FINANCE_MONTHLY_GROWTH_RATE) || DEFAULT_MONTHLY_GROWTH_RATE
        : DEFAULT_MONTHLY_GROWTH_RATE;

    const forecast = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      projectedMRR: Math.round(currentMRR * Math.pow(1 + monthlyGrowthRate, i) * 100) / 100,
    }));

    return NextResponse.json({
      currentMRR,
      monthlyGrowthRate,
      forecast,
    });
  } catch (e) {
    console.error("[FINANCIALS FORECAST]", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
