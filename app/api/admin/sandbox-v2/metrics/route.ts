import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    if (!sandboxId) return NextResponse.json({ success: false, error: "Missing sandboxId" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const [sessionRes, metricsRes, employersRes, employeesRes, recordsRes, reviewsRes, intelRes, revenueRes, adsRes] = await Promise.all([
      supabase.from("sandbox_sessions").select("id, name, starts_at, ends_at, status").eq("id", sandboxId).maybeSingle(),
      supabase.from("sandbox_metrics").select("*").eq("sandbox_id", sandboxId).maybeSingle(),
      supabase.from("sandbox_employers").select("id, company_name, industry, plan_tier").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_employees").select("id, full_name, industry").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_employment_records").select("id").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_peer_reviews").select("id, rating, sentiment_score").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_intelligence_outputs").select("employee_id, profile_strength, career_health, risk_index, team_fit, hiring_confidence, network_density").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_revenue").select("mrr, churn_rate").eq("sandbox_id", sandboxId),
      supabase.from("sandbox_ads").select("impressions, clicks, spend, roi").eq("sandbox_id", sandboxId),
    ]);

    if (sessionRes.error) {
      console.error("Supabase error:", sessionRes.error);
      return NextResponse.json({
        success: false,
        stage: "get",
        error: sessionRes.error?.message,
        details: sessionRes.error,
      }, { status: 500 });
    }

    const session = sessionRes.data;
    let metricsRow = metricsRes.data;
    if (!metricsRow && !metricsRes.error) {
      await calculateSandboxMetrics(sandboxId);
      const { data: refreshed } = await supabase.from("sandbox_metrics").select("*").eq("sandbox_id", sandboxId).maybeSingle();
      metricsRow = refreshed ?? null;
    }

    const employers = employersRes.data ?? [];
    const employees = employeesRes.data ?? [];
    const records = recordsRes.data ?? [];
    const reviews = reviewsRes.data ?? [];
    const intel = intelRes.data ?? [];
    const revenue = revenueRes.data ?? [];
    const ads = adsRes.data ?? [];

    const m = metricsRow as {
      profiles_count?: number;
      employment_records_count?: number;
      references_count?: number;
      avg_profile_strength?: number | null;
      avg_career_health?: number | null;
      avg_risk_index?: number | null;
      avg_team_fit?: number | null;
      avg_hiring_confidence?: number | null;
      avg_network_density?: number | null;
      mrr?: number | null;
      ad_roi?: number | null;
    } | null;

    const profilesCount = m?.profiles_count ?? employees.length;
    const employmentRecordsCount = m?.employment_records_count ?? records.length;
    const referencesCount = m?.references_count ?? reviews.length;
    const avgProfileStrength = m?.avg_profile_strength ?? (intel.length > 0 ? intel.reduce<number>((s, r) => s + (r.profile_strength ?? 0), 0) / intel.length : null);
    const avgHiringConfidence = m?.avg_hiring_confidence ?? (intel.length > 0 ? intel.reduce<number>((s, r) => s + (r.hiring_confidence ?? 0), 0) / intel.length : null);
    const totalSpend = ads.reduce<number>((s, r) => s + Number(r.spend ?? 0), 0);
    const totalClicks = ads.reduce<number>((s, r) => s + Number(r.clicks ?? 0), 0);
    const totalImpressions = ads.reduce<number>((s, r) => s + Number(r.impressions ?? 0), 0);
    const mrr = m?.mrr ?? (revenue.length > 0 ? Number((revenue[0] as { mrr?: number }).mrr ?? 0) : 0);
    const churn_rate = revenue.length > 0 ? Number((revenue[0] as { churn_rate?: number }).churn_rate ?? 0) : 0;
    const adRoi = m?.ad_roi ?? (totalSpend > 0 && totalClicks > 0 ? (totalClicks * 150 - totalSpend) / totalSpend : null);
    const dataDensityIndex = profilesCount + employmentRecordsCount + referencesCount;

    const employersCount = employers.length;
    const employeesCount = profilesCount;
    const peerReviewsCount = referencesCount;
    const totalAdSpend = totalSpend;

    console.log("Sandbox metrics fetched:", sandboxId);

    const result = {
      metrics: {
        employers: employersCount,
        employees: employeesCount,
        peerReviews: peerReviewsCount,
        avgProfileStrength: avgProfileStrength ?? null,
        avgHiringConfidence: avgHiringConfidence ?? null,
        totalAdSpend,
      },
      session,
      sandbox_metrics: metricsRow ? {
        profiles_count: m?.profiles_count,
        employment_records_count: m?.employment_records_count,
        references_count: m?.references_count,
        avg_profile_strength: m?.avg_profile_strength,
        avg_career_health: m?.avg_career_health,
        avg_risk_index: m?.avg_risk_index,
        avg_team_fit: m?.avg_team_fit,
        avg_hiring_confidence: m?.avg_hiring_confidence,
        avg_network_density: m?.avg_network_density,
        mrr: m?.mrr,
        ad_roi: m?.ad_roi,
      } : null,
      employeeIntelligence: {
        employeesCount: profilesCount,
        employmentRecordsCount,
        peerReviewsCount: referencesCount,
        avgHiringConfidence,
        avgProfileStrength,
        outputs: intel,
        employees: employees.map((e) => ({ id: e.id, full_name: e.full_name ?? "", industry: e.industry ?? null })),
      },
      employerAnalytics: { employersCount: employers.length, employers: employers.map((e) => ({ id: e.id, company_name: e.company_name ?? "" })) },
      revenueSimulation: { mrr, churn_rate, revenueRows: revenue.length },
      adsSimulation: { campaignsCount: ads.length, totalSpend, totalImpressions, totalClicks, ads },
      rawCounts: { profiles: profilesCount, employers: employers.length, employmentRecords: employmentRecordsCount, references: referencesCount },
      executive: { avgProfileStrength, avgHiringConfidence, totalSpend, adRoi, dataDensityIndex },
    };
    return NextResponse.json({ success: true, data: result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
