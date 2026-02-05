import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const sandboxId = req.nextUrl.searchParams.get("sandboxId")?.trim() ?? null;
    if (!sandboxId) return NextResponse.json({ error: "Missing sandboxId" }, { status: 400 });

    const [sessionRes, employersRes, employeesRes, recordsRes, reviewsRes, intelRes, revenueRes, adsRes, summaryRes] = await Promise.all([
      sb().from("sandbox_sessions").select("id, name, starts_at, ends_at, status").eq("id", sandboxId).maybeSingle(),
      sb().from("sandbox_employers").select("id, company_name, industry, plan_tier").eq("sandbox_id", sandboxId),
      sb().from("sandbox_employees").select("id, full_name, industry").eq("sandbox_id", sandboxId),
      sb().from("sandbox_employment_records").select("id").eq("sandbox_id", sandboxId),
      sb().from("sandbox_peer_reviews").select("id, rating, sentiment_score").eq("sandbox_id", sandboxId),
      sb().from("sandbox_intelligence_outputs").select("employee_id, profile_strength, career_health, risk_index, team_fit, hiring_confidence, network_density").eq("sandbox_id", sandboxId),
      sb().from("sandbox_revenue").select("mrr, churn_rate").eq("sandbox_id", sandboxId),
      sb().from("sandbox_ads").select("impressions, clicks, spend, roi").eq("sandbox_id", sandboxId),
      sb().from("sandbox_session_summary").select("avg_profile_strength, avg_career_health, avg_risk_index, hiring_confidence_mean, network_density, revenue_projection, ad_roi, data_density_index, demo_mode").eq("sandbox_id", sandboxId).maybeSingle(),
    ]);

    const session = sessionRes.data;
    const summary = summaryRes.data;
    const employers = employersRes.data ?? [];
    const employees = employeesRes.data ?? [];
    const records = recordsRes.data ?? [];
    const reviews = reviewsRes.data ?? [];
    const intel = intelRes.data ?? [];
    const revenue = revenueRes.data ?? [];
    const ads = adsRes.data ?? [];

    const avgProfileStrength = intel.length > 0 ? intel.reduce((s: number, r: { profile_strength?: number }) => s + (r.profile_strength ?? 0), 0) / intel.length : null;
    const avgHiringConfidence = intel.length > 0 ? intel.reduce((s: number, r: { hiring_confidence?: number }) => s + (r.hiring_confidence ?? 0), 0) / intel.length : null;
    const totalSpend = ads.reduce((s: number, r: { spend?: number }) => s + Number(r.spend ?? 0), 0);
    const totalClicks = ads.reduce((s: number, r: { clicks?: number }) => s + Number(r.clicks ?? 0), 0);
    const totalImpressions = ads.reduce((s: number, r: { impressions?: number }) => s + Number(r.impressions ?? 0), 0);
    const mrr = revenue.length > 0 ? Number((revenue[0] as { mrr?: number }).mrr ?? 0) : 0;
    const churn_rate = revenue.length > 0 ? Number((revenue[0] as { churn_rate?: number }).churn_rate ?? 0) : 0;
    const dataDensityIndex = employees.length + records.length + reviews.length;

    return NextResponse.json({
      session,
      employeeIntelligence: {
        employeesCount: employees.length,
        employmentRecordsCount: records.length,
        peerReviewsCount: reviews.length,
        avgHiringConfidence,
        avgProfileStrength,
        outputs: intel,
        employees: employees.map((e: { id: string; full_name?: string; industry?: string }) => ({ id: e.id, full_name: e.full_name ?? "", industry: e.industry ?? null })),
      },
      employerAnalytics: { employersCount: employers.length, employers: employers.map((e: { id: string; company_name?: string }) => ({ id: e.id, company_name: e.company_name ?? "" })) },
      revenueSimulation: { mrr, churn_rate, revenueRows: revenue.length },
      adsSimulation: { campaignsCount: ads.length, totalSpend, totalImpressions, totalClicks, ads },
      rawCounts: { profiles: employees.length, employers: employers.length, employmentRecords: records.length, references: reviews.length },
      executive: { avgProfileStrength, avgHiringConfidence, totalSpend, adRoi: totalSpend > 0 && totalClicks > 0 ? (totalClicks * 150 - totalSpend) / totalSpend : 0, dataDensityIndex },
      sessionSummary: summary ? {
        avg_profile_strength: summary.avg_profile_strength,
        avg_career_health: summary.avg_career_health,
        avg_risk_index: summary.avg_risk_index,
        hiring_confidence_mean: summary.hiring_confidence_mean,
        network_density: summary.network_density,
        revenue_projection: summary.revenue_projection,
        ad_roi: summary.ad_roi,
        data_density_index: summary.data_density_index,
        demo_mode: summary.demo_mode,
      } : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
