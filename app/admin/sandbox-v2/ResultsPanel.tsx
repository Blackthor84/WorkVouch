"use client";

type SandboxMetricsRow = {
  profiles_count?: number;
  employment_records_count?: number;
  references_count?: number;
  avg_profile_strength?: number | null;
  avg_hiring_confidence?: number | null;
  mrr?: number | null;
} | null;

interface ResultsPanelProps {
  dashboardData: {
    employers: { id: string }[];
    employees: { id: string }[];
    employeeIntelligence: {
      employeesCount: number;
      employmentRecordsCount: number;
      peerReviewsCount: number;
      avgHiringConfidence: number | null;
      avgProfileStrength: number | null;
    } | null;
    revenueSimulation: { mrr: number } | null;
    sandbox_metrics: SandboxMetricsRow;
  } | null;
  previousAvgHiringConfidence: number | null;
  fraudFlagsCount?: number;
  rehireEligibleCount?: number;
  totalEmploymentRecords?: number;
}

export function ResultsPanel({
  dashboardData,
  previousAvgHiringConfidence,
  fraudFlagsCount = 0,
  rehireEligibleCount,
  totalEmploymentRecords,
}: ResultsPanelProps) {
  if (!dashboardData) {
    return (
      <aside className="rounded-xl border border-slate-600 bg-slate-800/70 p-4">
        <h2 className="text-sm font-semibold text-slate-300">Results</h2>
        <p className="mt-2 text-sm text-slate-300">Select a sandbox to see summary.</p>
      </aside>
    );
  }

  const employers = dashboardData.employers ?? [];
  const employees = dashboardData.employees ?? [];
  const ei = dashboardData.employeeIntelligence;
  const rev = dashboardData.revenueSimulation;
  const metrics = dashboardData.sandbox_metrics;
  const avgHiringConfidence = ei?.avgHiringConfidence ?? metrics?.avg_hiring_confidence ?? null;
  const numAvg =
    avgHiringConfidence != null ? Number(avgHiringConfidence) : null;
  const prevNum = previousAvgHiringConfidence;
  const scoreDelta =
    numAvg != null && prevNum != null ? (numAvg - prevNum).toFixed(1) : null;
  const mrr = rev?.mrr ?? metrics?.mrr ?? null;
  const employmentRecords = totalEmploymentRecords ?? ei?.employmentRecordsCount ?? 0;
  const peerReviews = ei?.peerReviewsCount ?? 0;

  return (
    <aside className="sticky top-24 flex flex-col gap-4 self-start rounded-xl border border-slate-600 bg-slate-800/70 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Results summary</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">Avg hiring confidence</span>
          <span className="font-semibold text-slate-100">
            {numAvg != null ? numAvg.toFixed(1) : "—"}
          </span>
        </div>
        {scoreDelta != null && (
          <div className="flex justify-between">
            <span className="font-medium text-slate-300">Score delta (last recalc)</span>
            <span
              className={
                Number(scoreDelta) >= 0
                  ? "font-semibold text-emerald-400"
                  : "font-semibold text-amber-400"
              }
            >
              {Number(scoreDelta) >= 0 ? "+" : ""}
              {scoreDelta}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">Total employees</span>
          <span className="font-semibold text-slate-100">{employees.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">Total employers</span>
          <span className="font-semibold text-slate-100">{employers.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">Peer review count</span>
          <span className="font-semibold text-slate-100">{peerReviews}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">Employment records</span>
          <span className="font-semibold text-slate-100">{employmentRecords}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-slate-300">MRR</span>
          <span className="font-semibold text-slate-100">
            {mrr != null ? Number(mrr) : "—"}
          </span>
        </div>
        {rehireEligibleCount != null && (
          <div className="flex justify-between">
            <span className="font-medium text-slate-300">Rehire influence</span>
            <span className="font-semibold text-slate-100">
              {rehireEligibleCount} rehire-eligible
            </span>
          </div>
        )}
        {fraudFlagsCount > 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-amber-300">Fraud flags</span>
            <span className="font-semibold text-amber-400">{fraudFlagsCount}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
