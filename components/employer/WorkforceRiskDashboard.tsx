"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkforceRiskResponse {
  averageRisk: number;
  distribution: { low: number; moderate: number; high: number };
  totalEmployees: number;
  disputeCount: number;
  trend: { date: string; avgRisk: number }[];
  industryDelta?: number | null;
  canExportRiskSummary?: boolean;
}

interface DepartmentRow {
  department: string;
  avgRisk: number;
  employeeCount: number;
}

interface RoleRow {
  role: string;
  avgRisk: number;
  employeeCount: number;
}

interface IndustryBenchmark {
  employerAverage: number;
  industryAverage: number;
  difference: number;
}

interface HistoryPoint {
  month: string;
  avgRisk: number;
}

export function WorkforceRiskDashboard() {
  const [data, setData] = useState<WorkforceRiskResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [benchmark, setBenchmark] = useState<IndustryBenchmark | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const opts = { credentials: "include" as RequestCredentials };

    Promise.all([
      fetch("/api/employer/workforce-risk", opts).then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Feature not enabled" : "Failed to load");
        return r.json();
      }),
      fetch("/api/employer/workforce-risk/departments", opts).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/employer/workforce-risk/roles", opts).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/employer/workforce-risk/industry-benchmark", opts).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch("/api/employer/workforce-risk/history", opts).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([core, depts, roleList, bench, hist]) => {
        if (cancelled) return;
        if (core.error) throw new Error(core.error);
        setData(core);
        setDepartments(Array.isArray(depts) ? depts : []);
        setRoles(Array.isArray(roleList) ? roleList : []);
        setBenchmark(bench && !bench.error ? bench : null);
        setHistory(Array.isArray(hist) ? hist : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Unable to load risk overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDownloadSummary = () => {
    if (!data) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            averageRisk: data.averageRisk,
            distribution: data.distribution,
            totalEmployees: data.totalEmployees,
            disputeCount: data.disputeCount,
            trend: data.trend,
            industryDelta: data.industryDelta ?? null,
            departments,
            roles,
            benchmark,
            history,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-summary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Workforce Risk Intelligence
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Workforce Risk Intelligence
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "No data available."}</p>
      </Card>
    );
  }

  const total = data.distribution.low + data.distribution.moderate + data.distribution.high;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const lowPct = pct(data.distribution.low);
  const modPct = pct(data.distribution.moderate);
  const highPct = pct(data.distribution.high);

  const riskColor =
    data.averageRisk >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : data.averageRisk >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const statusLabel = (avgRisk: number) =>
    avgRisk >= 70 ? "Low risk" : avgRisk >= 40 ? "Moderate" : "High risk";
  const statusColor = (avgRisk: number) =>
    avgRisk >= 70
      ? "text-emerald-600 dark:text-emerald-400"
      : avgRisk >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const trendData = history.length > 0 ? history : data.trend.map((t) => ({ month: t.date.slice(0, 7), avgRisk: t.avgRisk }));

  return (
    <div className="space-y-6">
      <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1F2B] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Workforce Risk Intelligence
          </h3>
          {data.canExportRiskSummary && (
            <Button variant="secondary" size="sm" onClick={handleDownloadSummary}>
              Download Risk Summary
            </Button>
          )}
        </div>

        {/* Top row KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Average Risk
            </p>
            <p className={`text-2xl font-bold ${riskColor}`}>{data.averageRisk.toFixed(1)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">0–100 scale</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Verified Employees
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {data.totalEmployees}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Disputes
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{data.disputeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
              Industry Delta
            </p>
            {data.industryDelta != null ? (
              <>
                <p
                  className={
                    data.industryDelta >= 0
                      ? "text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                      : "text-2xl font-bold text-amber-600 dark:text-amber-400"
                  }
                >
                  {data.industryDelta >= 0 ? "+" : ""}
                  {data.industryDelta.toFixed(1)} pts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                  vs industry average
                </p>
              </>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm">—</p>
            )}
          </div>
        </div>

        {/* Risk distribution stacked bar */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Risk Distribution
          </p>
          <div className="h-8 w-full rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-700/50">
            {lowPct > 0 && (
              <div
                className="bg-emerald-500 dark:bg-emerald-600 transition-all"
                style={{ width: `${lowPct}%` }}
                title={`Low (70–100): ${data.distribution.low}`}
              />
            )}
            {modPct > 0 && (
              <div
                className="bg-amber-500 dark:bg-amber-600 transition-all"
                style={{ width: `${modPct}%` }}
                title={`Moderate (40–69): ${data.distribution.moderate}`}
              />
            )}
            {highPct > 0 && (
              <div
                className="bg-red-500 dark:bg-red-600 transition-all"
                style={{ width: `${highPct}%` }}
                title={`High (0–39): ${data.distribution.high}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-600 mr-1.5 align-middle" />
              Low: {data.distribution.low} ({lowPct}%)
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-600 mr-1.5 align-middle" />
              Moderate: {data.distribution.moderate} ({modPct}%)
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 dark:bg-red-600 mr-1.5 align-middle" />
              High: {data.distribution.high} ({highPct}%)
            </span>
          </div>
        </div>

        {/* Monthly trend */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Risk Trend by Month
          </p>
          <div className="flex items-end gap-0.5 h-24">
            {trendData.map(({ month, avgRisk }) => {
              const height = Math.min(100, Math.max(0, avgRisk));
              const barColor =
                avgRisk >= 70
                  ? "bg-emerald-500/80 dark:bg-emerald-600/80"
                  : avgRisk >= 40
                    ? "bg-amber-500/80 dark:bg-amber-600/80"
                    : "bg-red-500/80 dark:bg-red-600/80";
              return (
                <div
                  key={month}
                  className="flex-1 min-w-0 flex flex-col items-center"
                  title={`${month}: ${avgRisk.toFixed(1)}`}
                >
                  <div
                    className={`w-full min-h-[2px] rounded-t ${barColor} transition-all`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-500">
            <span>{trendData[0]?.month ?? ""}</span>
            <span>{trendData[trendData.length - 1]?.month ?? ""}</span>
          </div>
        </div>
      </Card>

      {/* Department Risk Table */}
      {departments.length > 0 && (
        <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1F2B] shadow-sm">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Department Risk
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="pb-2 pr-4 font-medium">Department</th>
                  <th className="pb-2 pr-4 font-medium">Avg Risk</th>
                  <th className="pb-2 pr-4 font-medium">Employees</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((row) => (
                  <tr
                    key={row.department}
                    className="border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{row.department}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {row.avgRisk.toFixed(1)}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                      {row.employeeCount}
                    </td>
                    <td className={`py-2 font-medium ${statusColor(row.avgRisk)}`}>
                      {statusLabel(row.avgRisk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Role Risk Table */}
      {roles.length > 0 && (
        <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1F2B] shadow-sm">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Role Risk
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 pr-4 font-medium">Avg Risk</th>
                  <th className="pb-2 pr-4 font-medium">Employees</th>
                  <th className="pb-2 font-medium">Stability</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((row) => (
                  <tr
                    key={row.role}
                    className="border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{row.role}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">
                      {row.avgRisk.toFixed(1)}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                      {row.employeeCount}
                    </td>
                    <td className={`py-2 font-medium ${statusColor(row.avgRisk)}`}>
                      {statusLabel(row.avgRisk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Industry comparison card */}
      {benchmark != null && (
        <Card className="p-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1F2B] shadow-sm">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Industry Comparison
          </h4>
          {benchmark.industryAverage > 0 ? (
            <p className="text-slate-700 dark:text-slate-300">
              {benchmark.difference >= 0 ? (
                <>
                  You are{" "}
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {Math.abs(
                      Math.round((benchmark.difference / benchmark.industryAverage) * 100)
                    )}
                    % more stable
                  </span>{" "}
                  than industry average (your avg: {benchmark.employerAverage.toFixed(1)}, industry
                  avg: {benchmark.industryAverage.toFixed(1)}).
                </>
              ) : (
                <>
                  Your workforce risk is{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {Math.abs(
                      Math.round((benchmark.difference / benchmark.industryAverage) * 100)
                    )}
                    % higher
                  </span>{" "}
                  than industry average (your avg: {benchmark.employerAverage.toFixed(1)}, industry
                  avg: {benchmark.industryAverage.toFixed(1)}).
                </>
              )}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Industry benchmark available once more industry data is available.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
