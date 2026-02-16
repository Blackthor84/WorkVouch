/**
 * GET /api/admin/financials/export — aggregated financials as JSON (deck-ready).
 * Role-gated: finance | admin. Rate-limited, audit EXPORT_FINANCIALS. No PII.
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
    maxPerWindow: 30,
    prefix: "finance_export:",
  });
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  await logAudit({
    actorId: session.userId,
    action: "EXPORT_FINANCIALS",
    resource: "admin/financials/export",
  });

  try {
    const supabase = getSupabaseServer();
    const [paymentsRes, subsRes] = await Promise.all([
      supabase.from("finance_payments").select("amount_cents"),
      supabase.from("finance_subscriptions").select("monthly_amount_cents").eq("status", "active"),
    ]);

    const totalRevenueCents = (paymentsRes.data ?? []).reduce(
      (sum: number, r: { amount_cents?: number }) => sum + (r.amount_cents ?? 0),
      0
    );
    const activeSubs = subsRes.data ?? [];
    const mrrCents = activeSubs.reduce(
      (sum: number, r: { monthly_amount_cents?: number }) => sum + (r.monthly_amount_cents ?? 0),
      0
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      metrics: {
        totalRevenue: Math.round(totalRevenueCents / 100 * 100) / 100,
        MRR: Math.round(mrrCents / 100 * 100) / 100,
        ARR: Math.round((mrrCents * 12) / 100 * 100) / 100,
        activeSubscriptions: activeSubs.length,
      },
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[FINANCIALS EXPORT]", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
