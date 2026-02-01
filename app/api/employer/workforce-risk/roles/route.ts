import { NextResponse } from "next/server";
import { requireWorkforceRiskEmployer } from "@/lib/employer-workforce-risk-auth";

export const dynamic = "force-dynamic";

type ReportRow = { job_role: string | null; risk_score: number; worker_id: string };

/**
 * GET /api/employer/workforce-risk/roles
 * Group by job_role. Employer-only, feature-gated.
 */
export async function GET() {
  try {
    const ctx = await requireWorkforceRiskEmployer();
    if (!ctx) return NextResponse.json({ error: "Unauthorized or feature not enabled" }, { status: 403 });
    const { supabase, auth } = ctx;

    let list: ReportRow[] = [];
    try {
      const { data: reports } = await supabase
        .from("verification_reports")
        .select("job_role, risk_score, worker_id")
        .eq("employer_id", auth.employerId)
        .not("risk_score", "is", null);
      list = reports ?? [];
    } catch {
      return NextResponse.json([]);
    }
    const completed = list.filter((r) => r.risk_score != null && Number.isFinite(Number(r.risk_score)));

    const byRole: Record<string, { scores: number[]; workers: Set<string> }> = {};
    for (const r of completed) {
      const key = r.job_role?.trim() || "(Unspecified)";
      if (!byRole[key]) byRole[key] = { scores: [], workers: new Set() };
      byRole[key].scores.push(Number(r.risk_score));
      byRole[key].workers.add(r.worker_id);
    }

    const result = Object.entries(byRole).map(([role, { scores, workers }]) => ({
      role,
      avgRisk: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
      employeeCount: workers.size,
    }));

    result.sort((a, b) => b.employeeCount - a.employeeCount);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Workforce risk roles API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
