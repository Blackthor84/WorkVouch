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

    const sandboxId = searchParams.get("sandboxId")?.trim() || null;
    if (!sandboxId && searchParams.has("sandboxId")) {
      return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });
    }
    if (sandboxId) {
      console.log("Fetching sandbox metrics for:", sandboxId);

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
        employmentRecordsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id, company_name").eq("sandbox_id", sandboxId).order("company_name"),
        supabase.from("employment_references").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("hiring_confidence_scores").select("id, composite_score").eq("sandbox_id", sandboxId).limit(100),
        supabase.from("sandbox_ad_campaigns").select("id, impressions, clicks, conversions, spend").eq("sandbox_id", sandboxId),
        supabase.from("employment_records").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
      ]);

      const hiringRows = (hiringRes.data ?? []) as { composite_score?: number }[];
      const adsRows = (adsRes.data ?? []) as { spend?: number; impressions?: number; clicks?: number; conversions?: number }[];
      const employersList = (employersListRes.data ?? []) as { id: string; company_name?: string | null }[];

      const profilesCount = profilesRes.count ?? 0;
      const employersCount = employersRes.count ?? 0;
      const referencesCount = refsRes.count ?? 0;
      const employmentRecordsCount = employmentRecordsRes.count ?? 0;

      console.log("Profiles found:", profilesCount);
      console.log("Employers found:", employersList?.length ?? 0);
      console.log("Employment records found:", employmentRecordsCount);
      console.log("References found:", referencesCount);
      const avgHiringConfidence =
        hiringRows.length > 0
          ? hiringRows.reduce((sum, row) => sum + (typeof row.composite_score === "number" ? row.composite_score : 0), 0) / hiringRows.length
          : null;
      const totalSpend = adsRows.reduce((s, r) => s + Number(r.spend ?? 0), 0);
      const totalConversions = adsRows.reduce((s, r) => s + Number(r.conversions ?? 0), 0);
      const n = profilesCount + referencesCount || 1;
      const profileStrength = n > 0 ? Math.min(100, 40 + (referencesCount / Math.max(1, profilesCount)) * 15) : 0;
      const careerHealth = avgHiringConfidence ?? 0;
      const riskIndex = 100 - careerHealth;
      const teamFit = careerHealth * 0.95;
      const hiringConfidence = careerHealth;
      const networkDensity = Math.min(100, (referencesCount / Math.max(1, profilesCount)) * 25);
      const dataDensity = profilesCount + referencesCount;
      const mrrSandbox = 0;
      const adRoiSandbox = totalSpend > 0 && totalConversions > 0 ? (totalConversions * 150) / totalSpend : 0;

      const metricsPayload = {
        profiles_count: profilesCount,
        employers_count: employersCount,
        peer_reviews_count: referencesCount,
        hiring_confidence_avg: avgHiringConfidence,
        hiring_confidence_sample: hiringRows.slice(0, 10).map((r) => r.composite_score),
        ad_campaigns_count: adsRows.length,
        ad_total_spend: totalSpend,
        ad_total_impressions: adsRows.reduce((s, r) => s + Number(r.impressions ?? 0), 0),
        ad_total_clicks: adsRows.reduce((s, r) => s + Number(r.clicks ?? 0), 0),
        ad_total_conversions: totalConversions,
        employers: employersList.map((e) => ({ id: e.id, company_name: e.company_name ?? "" })),
        profileStrength,
        careerHealth,
        riskIndex,
        teamFit,
        hiringConfidence,
        networkDensity,
        profilesCount,
        employmentRecordsCount,
        referencesCount,
        dataDensity,
        mrrSandbox,
        adRoiSandbox,
      };

      return NextResponse.json({
        sandbox: { id: sandbox.id, name: sandbox.name, starts_at: sandbox.starts_at, ends_at: sandbox.ends_at, status: sandbox.status },
        metrics: metricsPayload,
      });
    }


    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sandbox GET fatal error:", err);
    return NextResponse.json({ sandboxes: [] });
  }
}
