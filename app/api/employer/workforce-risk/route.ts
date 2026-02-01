import { NextResponse } from "next/server";
import { requireWorkforceRiskEmployer } from "@/lib/employer-workforce-risk-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/employer/workforce-risk
 * Structured risk overview from verification_reports. Gated by workforce_risk_dashboard.
 * Never exposes risk_metadata, weighting, or fraud score.
 */
export async function GET() {
  try {
    const ctx = await requireWorkforceRiskEmployer();
    if (!ctx) return NextResponse.json({ error: "Unauthorized or feature not enabled" }, { status: 403 });
    const { supabase, auth } = ctx;
    const employerId = auth.employerId;

    const { data: reports } = await supabase
      .from("verification_reports")
      .select("risk_score, created_at, worker_id")
      .eq("employer_id", employerId)
      .not("risk_score", "is", null);

    const list = (reports ?? []) as { risk_score: number; created_at: string; worker_id: string }[];
    const completed = list.filter((r) => r.risk_score != null && Number.isFinite(Number(r.risk_score)));

    const totalEmployees = new Set(completed.map((r) => r.worker_id)).size;
    const scores = completed.map((r) => Number(r.risk_score));
    const averageRisk = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    let low = 0;
    let moderate = 0;
    let high = 0;
    for (const s of scores) {
      if (s >= 70) low++;
      else if (s >= 40) moderate++;
      else high++;
    }

    const { count: disputeCount } = await supabase
      .from("employer_disputes")
      .select("id", { count: "exact", head: true })
      .eq("employer_account_id", employerId);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const byDate: Record<string, number[]> = {};
    for (let d = 0; d < 30; d++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      byDate[key] = [];
    }
    for (const r of completed) {
      const key = r.created_at.slice(0, 10);
      if (byDate[key]) byDate[key].push(r.risk_score);
    }
    const trend = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        avgRisk: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      }));

    let industryDelta: number | null = null;
    if (auth.industry) {
      try {
        const { data: industryReports } = await supabase
          .from("verification_reports")
          .select("risk_score")
          .eq("industry", auth.industry)
          .not("risk_score", "is", null);
        const industryScores = (industryReports ?? []).map((r) => Number(r.risk_score)).filter(Number.isFinite);
        const industryAverage = industryScores.length
          ? Math.round((industryScores.reduce((a, b) => a + b, 0) / industryScores.length) * 10) / 10
          : 0;
        industryDelta = Math.round((averageRisk - industryAverage) * 10) / 10;
      } catch {
        industryDelta = null;
      }
    }

    return NextResponse.json({
      averageRisk,
      distribution: { low, moderate, high },
      totalEmployees,
      disputeCount: disputeCount ?? 0,
      trend,
      industryDelta,
      canExportRiskSummary: auth.enterpriseOverrideEnabled,
    });
  } catch (e) {
    console.error("Workforce risk API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
