/**
 * GET /api/directory/employers
 * List employers ranked by reputation_score. Gated by employer_reputation_marketplace feature flag.
 * Query: industry (optional), limit, offset.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sb = getSupabaseServer() as any;
    const { data: flag } = await sb
      .from("feature_flags")
      .select("id, is_globally_enabled")
      .eq("key", "employer_reputation_marketplace")
      .maybeSingle();

    if (!(flag as { is_globally_enabled?: boolean } | null)?.is_globally_enabled) {
      return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") ?? "";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

    let q = sb
      .from("employer_reputation_snapshots")
      .select("employer_id, reputation_score, percentile_rank, industry_percentile_rank, last_calculated_at")
      .order("reputation_score", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: snapshots, error: snapErr } = await q;

    if (snapErr) {
      console.error("[directory/employers]", snapErr);
      return NextResponse.json({ error: snapErr.message }, { status: 500 });
    }

    const list = Array.isArray(snapshots) ? snapshots : [];
    const employerIds = list.map((s: { employer_id: string }) => s.employer_id);
    if (employerIds.length === 0) {
      return NextResponse.json({ employers: [], total: 0 });
    }

    const { data: accounts } = await sb
      .from("employer_accounts")
      .select("id, company_name, industry_type")
      .in("id", employerIds);

    const accountMap = new Map<string, { company_name: string; industry_type?: string }>();
    for (const a of accounts ?? []) {
      const row = a as { id: string; company_name: string; industry_type?: string };
      accountMap.set(row.id, { company_name: row.company_name, industry_type: row.industry_type });
    }

    let results = list.map((s: { employer_id: string; reputation_score: number; percentile_rank?: number; industry_percentile_rank?: number; last_calculated_at?: string }) => ({
      employer_id: s.employer_id,
      company_name: accountMap.get(s.employer_id)?.company_name ?? "—",
      industry_type: accountMap.get(s.employer_id)?.industry_type ?? null,
      reputation_score: Number(s.reputation_score),
      percentile_rank: s.percentile_rank != null ? Number(s.percentile_rank) : null,
      industry_percentile_rank: s.industry_percentile_rank != null ? Number(s.industry_percentile_rank) : null,
      last_calculated_at: s.last_calculated_at ?? null,
    }));

    if (industry) {
      results = results.filter((r: { industry_type?: string | null }) => (r.industry_type ?? "").toLowerCase() === industry.toLowerCase());
    }

    return NextResponse.json({ employers: results, total: results.length });
  } catch (e) {
    console.error("[directory/employers]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
