/**
 * GET /api/admin/financials — aggregated revenue, MRR, ARR, active subscriptions.
 * Role-gated: finance | admin. Rate-limited, audit-logged. No PII; no per-user/per-employer amounts in response.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFinanceForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
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
    prefix: "finance:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: session.userId,
    action: "VIEW_FINANCIALS",
    resource: "admin/financials",
  });

  try {
    const supabase = getSupabaseServer();

    const [paymentsRes, subsRes] = await Promise.all([
      supabase.from("finance_payments").select("amount_cents"),
      supabase.from("finance_subscriptions").select("monthly_amount_cents").eq("status", "active"),
    ]);

    type PaymentRow = { amount_cents: number | null };
    type SubscriptionRow = { monthly_amount_cents: number | null };
    const payments: PaymentRow[] = (paymentsRes.data ?? []) as PaymentRow[];
    const totalRevenueCents = payments.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0) || 0;
    const activeSubs: SubscriptionRow[] = (subsRes.data ?? []) as SubscriptionRow[];
    const mrrCents = activeSubs.reduce((sum, row) => sum + (row.monthly_amount_cents ?? 0), 0);

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenueCents / 100 * 100) / 100,
      MRR: Math.round(mrrCents / 100 * 100) / 100,
      ARR: Math.round((mrrCents * 12) / 100 * 100) / 100,
      activeSubscriptions: activeSubs.length,
    });
  } catch (e) {
    console.error("[FINANCIALS API]", e);
    return NextResponse.json({
      totalRevenue: 0,
      MRR: 0,
      ARR: 0,
      activeSubscriptions: 0,
    }, { status: 200 });
  }
}
