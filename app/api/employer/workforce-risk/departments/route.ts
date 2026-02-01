import { NextResponse } from "next/server";
import { requireWorkforceRiskEmployer } from "@/lib/employer-workforce-risk-auth";

export const dynamic = "force-dynamic";

type ReportRow = { department: string; risk_score: number; worker_id: string };

type RawRow = { department: string | null; risk_score: number | null; worker_id: string | null };

function isReportRow(r: RawRow): r is ReportRow {
  return (
    r.risk_score !== null &&
    r.department !== null &&
    r.worker_id !== null &&
    Number.isFinite(r.risk_score)
  );
}

/**
 * GET /api/employer/workforce-risk/departments
 * Group by department. Employer-only, feature-gated.
 */
export async function GET() {
  try {
    const ctx = await requireWorkforceRiskEmployer();
    if (!ctx) return NextResponse.json({ error: "Unauthorized or feature not enabled" }, { status: 403 });
    const { supabase, auth } = ctx;

    let list: RawRow[] = [];
    try {
      const { data: reports } = await supabase
        .from("verification_reports")
        .select("department, risk_score, worker_id")
        .eq("employer_id", auth.employerId)
        .not("risk_score", "is", null);
      list = reports ?? [];
    } catch {
      return NextResponse.json([]);
    }
    const completed = list.filter(isReportRow);

    const byDept: Record<string, { scores: number[]; workers: Set<string> }> = {};
    for (const r of completed) {
      const key = r.department.trim() || "(Unspecified)";
      if (!byDept[key]) byDept[key] = { scores: [], workers: new Set() };
      byDept[key].scores.push(r.risk_score);
      byDept[key].workers.add(r.worker_id);
    }

    const result = Object.entries(byDept).map(([department, { scores, workers }]) => ({
      department,
      avgRisk: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
      employeeCount: workers.size,
    }));

    result.sort((a, b) => b.employeeCount - a.employeeCount);

    return NextResponse.json(result);
  } catch (e) {
    console.error("Workforce risk departments API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
