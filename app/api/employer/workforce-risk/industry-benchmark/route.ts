import { NextResponse } from "next/server";
import { requireWorkforceRiskEmployer } from "@/lib/employer-workforce-risk-auth";

export const dynamic = "force-dynamic";

function hasRiskScore(r: { risk_score: number | null }): r is { risk_score: number } {
  return r.risk_score !== null && Number.isFinite(r.risk_score);
}

/**
 * GET /api/employer/workforce-risk/industry-benchmark
 * Employer average vs industry average. Employer-only, feature-gated.
 */
export async function GET() {
  try {
    const ctx = await requireWorkforceRiskEmployer();
    if (!ctx) return NextResponse.json({ error: "Unauthorized or feature not enabled" }, { status: 403 });
    const { supabase, auth } = ctx;

    const { data: reports } = await supabase
      .from("verification_reports")
      .select("risk_score")
      .eq("employer_id", auth.employerId)
      .not("risk_score", "is", null);

    const employerScores = (reports ?? []).filter(hasRiskScore).map((r) => r.risk_score);
    const employerAverage = employerScores.length
      ? Math.round((employerScores.reduce((a, b) => a + b, 0) / employerScores.length) * 10) / 10
      : 0;

    let industryAverage = 0;
    if (auth.industry) {
      try {
        const { data: industryReports } = await supabase
          .from("verification_reports")
          .select("risk_score")
          .eq("industry", auth.industry)
          .not("risk_score", "is", null);
        const industryScores = (industryReports ?? []).filter(hasRiskScore).map((r) => r.risk_score);
        industryAverage = industryScores.length
          ? Math.round((industryScores.reduce((a, b) => a + b, 0) / industryScores.length) * 10) / 10
          : 0;
      } catch {
        industryAverage = 0;
      }
    }

    const difference = Math.round((employerAverage - industryAverage) * 10) / 10;

    return NextResponse.json({
      employerAverage,
      industryAverage,
      difference,
    });
  } catch (e) {
    console.error("Workforce risk industry-benchmark API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
