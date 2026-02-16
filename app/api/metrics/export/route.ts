/**
 * GET /api/metrics/export — investor deck–ready JSON. Chart-safe, no internal IDs, no per-user timestamps.
 * Gated by investorExport feature flag (404 when disabled). Aggregated only.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAnalyticsFeatureFlags } from "@/lib/admin/analytics-feature-flags";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export async function GET() {
  const flags = getAnalyticsFeatureFlags();
  if (!flags.investorExport) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const supabase = getSupabaseServer();

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
    const referencesPerUser = users === 0 ? 0 : Math.round((references / users) * 100) / 100;

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
        const { data: payments } = await supabase.from("finance_payments").select("amount_cents");
        const cents = (payments ?? []).reduce((s: number, r: { amount_cents?: number }) => s + (r.amount_cents ?? 0), 0);
        totalRevenue = Math.round(cents / 100 * 100) / 100;
      } catch {
        // omit if table missing
      }
    }

    const metrics: Record<string, unknown> = {
      users,
      weeklyActive,
      employers,
      referencesPerUser,
      verificationRate,
      statesActive: statesSet.size,
      countriesActive: countries.size,
    };
    if (totalRevenue !== undefined) metrics.totalRevenue = totalRevenue;

    const payload = {
      metrics,
      charts: {
        adoption: { users, weeklyActive, employers },
        trust: { verificationRate, referencesPerUser },
        reach: { statesActive: statesSet.size, countriesActive: countries.size },
      },
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("[METRICS EXPORT ERROR]", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
