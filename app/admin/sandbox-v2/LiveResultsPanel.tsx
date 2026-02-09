"use client";

type Employer = { id: string; company_name?: string; industry?: string; plan_tier?: string };
type Employee = { id: string; full_name?: string; industry?: string };
type IntelOutput = { employee_id: string; profile_strength?: number | null };
type SandboxMetricsRow = {
  avg_profile_strength?: number | null;
  avg_hiring_confidence?: number | null;
  mrr?: number | null;
} | null;

interface LiveResultsPanelProps {
  dashboardData: {
    employers: Employer[];
    employees: Employee[];
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
  intelByEmployeeId: Map<string, IntelOutput>;
  previousAvgHiringConfidence: number | null;
  fraudFlagsCount?: number;
  totalEmploymentRecords?: number;
  consoleLogs: string[];
}

export function LiveResultsPanel({
  dashboardData,
  intelByEmployeeId,
  previousAvgHiringConfidence,
  fraudFlagsCount = 0,
  totalEmploymentRecords = 0,
  consoleLogs,
}: LiveResultsPanelProps) {
  if (!dashboardData) {
    return (
      <aside className="sticky top-24 flex flex-col gap-4 self-start rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white">Live Results</h2>
        <p className="text-slate-300">Select a sandbox to see metrics and entities.</p>
      </aside>
    );
  }

  const employers = dashboardData.employers ?? [];
  const employees = dashboardData.employees ?? [];
  const ei = dashboardData.employeeIntelligence;
  const rev = dashboardData.revenueSimulation;
  const metrics = dashboardData.sandbox_metrics;
  const avgHiringConfidence = ei?.avgHiringConfidence ?? metrics?.avg_hiring_confidence ?? null;
  const numAvg = avgHiringConfidence != null ? Number(avgHiringConfidence) : null;
  const prevNum = previousAvgHiringConfidence;
  const scoreDelta = numAvg != null && prevNum != null ? numAvg - prevNum : null;
  const mrr = rev?.mrr ?? metrics?.mrr ?? null;
  const employmentRecords = totalEmploymentRecords ?? ei?.employmentRecordsCount ?? 0;
  const peerReviews = ei?.peerReviewsCount ?? 0;

  const card = "rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl";
  const rowHover = "hover:bg-slate-800/80 transition-colors";

  return (
    <aside className="sticky top-24 flex flex-col gap-6 self-start rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white">Live Results</h2>

      {/* Live Metrics */}
      <section className={card}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Live Metrics</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between text-white">
            <span className="text-slate-300">Avg hiring confidence</span>
            <span className="font-semibold">{numAvg != null ? numAvg.toFixed(1) : "—"}</span>
          </div>
          {scoreDelta != null && (
            <div className="flex justify-between">
              <span className="text-slate-300">Score delta</span>
              <span className={scoreDelta >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                {scoreDelta >= 0 ? "+" : ""}{scoreDelta.toFixed(1)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-white">
            <span className="text-slate-300">Total employees</span>
            <span className="font-semibold">{employees.length}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-slate-300">Total employers</span>
            <span className="font-semibold">{employers.length}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-slate-300">Peer reviews</span>
            <span className="font-semibold">{peerReviews}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-slate-300">Employment records</span>
            <span className="font-semibold">{employmentRecords}</span>
          </div>
          <div className="flex justify-between text-white">
            <span className="text-slate-300">MRR</span>
            <span className="font-semibold">{mrr != null ? Number(mrr) : "—"}</span>
          </div>
        </div>
      </section>

      {/* Generated Employers */}
      <section className={card}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Generated Employers</h3>
        <div className="mt-3 max-h-48 overflow-y-auto">
          {employers.length === 0 ? (
            <p className="text-sm text-slate-200">None yet</p>
          ) : (
            <ul className="space-y-1">
              {employers.map((e) => (
                <li
                  key={e.id}
                  className={`flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-sm ${rowHover}`}
                >
                  <div>
                    <span className="font-medium text-white">{e.company_name ?? e.id.slice(0, 8)}</span>
                    <span className="ml-2 text-slate-200">{e.industry ?? "—"}</span>
                    <span className="ml-2 text-slate-200">· {e.plan_tier ?? "—"}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-600/20"
                    disabled
                    title="Delete (requires backend)"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Generated Employees */}
      <section className={card}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Generated Employees</h3>
        <div className="mt-3 max-h-48 overflow-y-auto">
          {employees.length === 0 ? (
            <p className="text-sm text-slate-200">None yet</p>
          ) : (
            <ul className="space-y-1">
              {employees.map((e) => {
                const intel = intelByEmployeeId.get(e.id);
                const score = intel?.profile_strength != null ? Number(intel.profile_strength).toFixed(0) : "—";
                return (
                  <li
                    key={e.id}
                    className={`flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-sm ${rowHover}`}
                  >
                    <div>
                      <span className="font-medium text-white">{e.full_name ?? e.id.slice(0, 8)}</span>
                      <span className="ml-2 text-slate-200">{e.industry ?? "—"}</span>
                      <span className="ml-2 text-slate-300">Score: {score}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-600/20"
                      disabled
                      title="Delete (requires backend)"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Fraud Flags */}
      {fraudFlagsCount > 0 && (
        <section className={card}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-400">Fraud Flags</h3>
          <p className="mt-2 text-sm font-semibold text-amber-400">{fraudFlagsCount} flag(s)</p>
        </section>
      )}

      {/* Recent Actions Log */}
      <section className={card}>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Recent Actions Log</h3>
        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-3 font-mono text-xs">
          {consoleLogs.length === 0 ? (
            <p className="text-slate-300">No output yet.</p>
          ) : (
            consoleLogs.slice(-20).map((line, i) => (
              <p
                key={i}
                className={
                  line.startsWith("[ERR]") ? "text-red-400" : line.startsWith("[OK]") ? "text-emerald-400" : "text-slate-300"
                }
              >
                {line}
              </p>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
