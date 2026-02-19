/**
 * GET /api/admin/dashboard/overview — admin or superadmin. Production data: users, employers,
 * paid subs, revenue, reviews/day, reputation histogram. No mock data.
 * Auth: session from cookies (Supabase server client); role from session.user.app_metadata.role only.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKETS = [0, 20, 40, 60, 80, 100]; // 0–20, 20–40, …, 80–100

/** Guaranteed shape for admin overview. Never return null or omit reputationHistogram. */
type OverviewPayload = {
  totalUsers: number;
  totalEmployers: number;
  paidSubscriptions: number;
  revenue: number;
  reviewsPerDay: number;
  reputationHistogram: { bucket: string; count: number }[];
};

const DEFAULT_OVERVIEW_PAYLOAD: OverviewPayload = {
  totalUsers: 0,
  totalEmployers: 0,
  paidSubscriptions: 0,
  revenue: 0,
  reviewsPerDay: 0,
  reputationHistogram: [],
};

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = (session.user as { app_metadata?: { role?: string } }).app_metadata?.role;
  console.log("ADMIN API ROLE:", role);

  const roleLower = String(role ?? "").toLowerCase();
  if (!["admin", "superadmin"].includes(roleLower)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const supabase = getSupabaseServer();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      profilesRes,
      employersRes,
      refs24hRes,
      trustScoresRes,
      financePaymentsRes,
      financeSubsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase
        .from("user_references")
        .select("id", { count: "exact", head: true })
        .gte("created_at", dayAgo),
      supabase.from("trust_scores").select("user_id, score"),
      supabase.from("finance_payments").select("amount_cents").limit(10000),
      supabase.from("finance_subscriptions").select("id").eq("status", "active"),
    ]);

    const totalUsers = typeof profilesRes.count === "number" ? profilesRes.count : 0;
    const totalEmployers = typeof employersRes.count === "number" ? employersRes.count : 0;
    const reviewsPerDay = typeof refs24hRes.count === "number" ? refs24hRes.count : 0;

    let revenue = 0;
    const payments = (financePaymentsRes.data ?? []) as { amount_cents: number | null }[];
    for (const row of payments) revenue += row.amount_cents ?? 0;
    revenue = Math.round((revenue / 100) * 100) / 100;

    const paidSubscriptions = Array.isArray(financeSubsRes.data) ? financeSubsRes.data.length : 0;

    const scores = (trustScoresRes.data ?? []) as { score: number | null }[];
    const histogram: { bucket: string; count: number }[] = BUCKETS.slice(0, -1).map((low, i) => {
      const high = BUCKETS[i + 1];
      const count = scores.filter((s) => {
        const v = s.score ?? 0;
        return v >= low && (i === BUCKETS.length - 2 ? v <= high : v < high);
      }).length;
      return { bucket: `${low}–${high}`, count };
    });

    const payload: OverviewPayload = {
      ...DEFAULT_OVERVIEW_PAYLOAD,
      totalUsers,
      totalEmployers,
      paidSubscriptions,
      revenue,
      reviewsPerDay,
      reputationHistogram: Array.isArray(histogram) ? histogram : [],
    };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[admin/dashboard/overview]", e);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
