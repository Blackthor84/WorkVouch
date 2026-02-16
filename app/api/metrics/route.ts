/**
 * GET /api/metrics — investor-safe aggregated metrics (read-only).
 * No auth required. No PII. Revenue included when financeMetrics flag is on.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAnalyticsFeatureFlags } from "@/lib/admin/analytics-feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const flags = getAnalyticsFeatureFlags();

    const [
      profilesRes,
      employersRes,
      sessionsRes,
      referencesRes,
      recordsRes,
      verifiedRes,
      locationsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase.from("site_sessions").select("user_id").gte("last_seen_at", SEVEN_DAYS_AGO).not("user_id", "is", null),
      supabase.from("employment_references").select("id", { count: "exact", head: true }),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("employment_records").select("id", { count: "exact", head: true }).in("verification_status", ["verified", "matched"]).or("is_simulation.is.null,is_simulation.eq.false"),
      supabase.from("user_locations").select("country, state"),
    ]);

    const users = typeof profilesRes.count === "number" ? profilesRes.count : 0;
    const employers = typeof employersRes.count === "number" ? employersRes.count : 0;
    const weeklyActive = new Set((sessionsRes.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean)).size;
    const references = typeof referencesRes.count === "number" ? referencesRes.count : 0;
    const totalRecords = typeof recordsRes.count === "number" ? recordsRes.count : 0;
    const verifiedRecords = typeof verifiedRes.count === "number" ? verifiedRes.count : 0;
    const verificationRate = totalRecords === 0 ? 0 : Math.round((verifiedRecords / totalRecords) * 100);
    const referencesPerUser = users === 0 ? "0" : (references / users).toFixed(2);

    const countries = new Set<string>();
    const statesSet = new Set<string>();
    for (const r of locationsRes.data ?? []) {
      const row = r as { country: string; state: string | null };
      if (row.country) countries.add(row.country);
      if (row.state?.trim()) statesSet.add(row.state.trim());
    }

    let totalRevenue: number | undefined;
    if (flags.financeMetrics) {
      try {
        const { data: paymentsData } = await supabase.from("finance_payments").select("amount_cents");
        type PaymentRow = { amount_cents: number | null };
        const payments: PaymentRow[] = (paymentsData ?? []) as PaymentRow[];
        const cents = payments.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
        totalRevenue = Math.round(cents / 100 * 100) / 100;
      } catch {
        // Table may not exist; omit revenue
      }
    }

    const body: Record<string, unknown> = {
      users,
      weeklyActive,
      employers,
      referencesPerUser: parseFloat(referencesPerUser),
      verificationRate,
      statesActive: statesSet.size,
      countriesActive: countries.size,
    };
    if (totalRevenue !== undefined) body.totalRevenue = totalRevenue;

    return NextResponse.json(body);
  } catch (e) {
    console.error("[METRICS ERROR]", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
