/**
 * GET /api/admin/intelligence-sandbox
 * ?list=1 → list intelligence_sandboxes. Never returns 400; always structured JSON.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log("Sandbox GET hit");

    const supabase = getSupabaseServer();
    const { searchParams } = new URL(req.url);

    if (searchParams.get("list") === "1") {
      const { data, error } = await supabase
        .from("intelligence_sandboxes")
        .select("id, name, starts_at, ends_at, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Sandbox list error:", error);
        return NextResponse.json({ sandboxes: [] });
      }

      return NextResponse.json({ sandboxes: data ?? [] });
    }

    const sandboxId = searchParams.get("sandboxId");
    if (sandboxId) {
      const { data: sandbox, error: sbErr } = await supabase
        .from("intelligence_sandboxes")
        .select("id, name, starts_at, ends_at, status")
        .eq("id", sandboxId)
        .maybeSingle();

      if (sbErr || !sandbox) {
        console.error("Sandbox fetch error:", sbErr);
        return NextResponse.json({ sandbox: null, metrics: null });
      }

      const [
        profilesRes,
        employersRes,
        employersListRes,
        refsRes,
        hiringRes,
        adsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id, company_name").eq("sandbox_id", sandboxId).order("company_name"),
        supabase.from("employment_references").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("hiring_confidence_scores").select("id, composite_score").eq("sandbox_id", sandboxId).limit(100),
        supabase.from("sandbox_ad_campaigns").select("id, impressions, clicks, conversions, spend").eq("sandbox_id", sandboxId),
      ]);

      const hiringRows = (hiringRes.data ?? []) as { composite_score?: number }[];
      const adsRows = (adsRes.data ?? []) as { spend?: number; impressions?: number; clicks?: number; conversions?: number }[];
      const employersList = (employersListRes.data ?? []) as { id: string; company_name?: string | null }[];

      const avgHiringConfidence =
        hiringRows.length > 0
          ? hiringRows.reduce((sum, row) => sum + (typeof row.composite_score === "number" ? row.composite_score : 0), 0) / hiringRows.length
          : null;

      return NextResponse.json({
        sandbox: { id: sandbox.id, name: sandbox.name, starts_at: sandbox.starts_at, ends_at: sandbox.ends_at, status: sandbox.status },
        metrics: {
          profiles_count: profilesRes.count ?? 0,
          employers_count: employersRes.count ?? 0,
          peer_reviews_count: refsRes.count ?? 0,
          hiring_confidence_avg: avgHiringConfidence,
          hiring_confidence_sample: hiringRows.slice(0, 10).map((r) => r.composite_score),
          ad_campaigns_count: adsRows.length,
          ad_total_spend: adsRows.reduce((s, r) => s + Number(r.spend ?? 0), 0),
          ad_total_impressions: adsRows.reduce((s, r) => s + Number(r.impressions ?? 0), 0),
          ad_total_clicks: adsRows.reduce((s, r) => s + Number(r.clicks ?? 0), 0),
          ad_total_conversions: adsRows.reduce((s, r) => s + Number(r.conversions ?? 0), 0),
          employers: employersList.map((e) => ({ id: e.id, company_name: e.company_name ?? "" })),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sandbox GET fatal error:", err);
    return NextResponse.json({ sandboxes: [] });
  }
}
