import { NextResponse } from "next/server";
import { requireWorkforceRiskEmployer } from "@/lib/employer-workforce-risk-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/employer/workforce-risk/history
 * Risk averages by month. Employer-only, feature-gated.
 */
export async function GET() {
  try {
    const ctx = await requireWorkforceRiskEmployer();
    if (!ctx) return NextResponse.json({ error: "Unauthorized or feature not enabled" }, { status: 403 });
    const { supabase, auth } = ctx;

    const { data: reports } = await supabase
      .from("verification_reports")
      .select("risk_score, created_at")
      .eq("employer_id", auth.employerId)
      .not("risk_score", "is", null);

    const list = (reports ?? []) as { risk_score: number; created_at: string }[];
    const completed = list.filter((r) => r.risk_score != null && Number.isFinite(Number(r.risk_score)));

    const byMonth: Record<string, number[]> = {};
    for (const r of completed) {
      const month = r.created_at.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(Number(r.risk_score));
    }

    const result = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month,
        avgRisk: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0,
      }));

    return NextResponse.json(result);
  } catch (e) {
    console.error("Workforce risk history API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
