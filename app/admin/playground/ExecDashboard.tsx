"use client";

import { complianceRisk } from "@/lib/compliance/metrics";
import { CULTURE_COMPLIANCE } from "@/lib/playground/copy";

type EmployeeWithBeforeAfter = {
  before?: { trustScore: number };
  after?: { trustScore: number };
};

type Props = {
  employees: EmployeeWithBeforeAfter[];
  threshold: number;
};

export function ExecDashboard({ employees, threshold }: Props) {
  const beforeScores: number[] = employees.map(
    (e: EmployeeWithBeforeAfter) => Number(e.before?.trustScore ?? 0)
  );

  const afterScores: number[] = employees.map(
    (e: EmployeeWithBeforeAfter) => Number(e.after?.trustScore ?? 0)
  );

  const beforeAvg =
    beforeScores.length === 0
      ? 0
      : beforeScores.reduce((a, b) => a + b, 0) / beforeScores.length;

  const afterAvg =
    afterScores.length === 0
      ? 0
      : afterScores.reduce((a, b) => a + b, 0) / afterScores.length;

  const metrics = complianceRisk(
    beforeScores.map((s) => ({ trustScore: s })),
    threshold
  );
  const status =
    metrics.atRisk === 0 ? "Within compliance" : `${metrics.atRisk} at risk (${metrics.riskPercent}%)`;
  const riskConcentration = metrics.riskPercent;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{CULTURE_COMPLIANCE.title}</h2>
      <p className="text-sm text-slate-600 mb-3">{CULTURE_COMPLIANCE.subtext}</p>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">{CULTURE_COMPLIANCE.teamTrustBeforeAfter}</dt>
          <dd className="font-medium text-slate-900">
            {beforeAvg.toFixed(1)} → {afterAvg.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{CULTURE_COMPLIANCE.complianceThresholdStatus}</dt>
          <dd className="font-medium text-slate-900">{status}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{CULTURE_COMPLIANCE.riskConcentrationIndicator}</dt>
          <dd className="font-medium text-slate-900">{riskConcentration}%</dd>
        </div>
      </dl>
    </div>
  );
}
