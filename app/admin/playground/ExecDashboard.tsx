"use client";

import { complianceRisk } from "@/lib/compliance/metrics";
import { CULTURE_COMPLIANCE } from "@/lib/playground/copy";
import { simulateTrust } from "@/lib/trust/simulator";
import type { TrustSnapshot } from "@/lib/trust/types";

type EmployeeWithTrust = { trust: TrustSnapshot; name: string; [k: string]: unknown };

type Props = {
  employees: { trust: TrustSnapshot; name?: string }[] | { trustScore: number }[];
  threshold: number;
  /** Optional: simulated "after" state per employee for before/after comparison */
  simulatedAfter?: { trustScore: number }[];
};

export function ExecDashboard({ employees, threshold, simulatedAfter }: Props) {
  const withTrust = employees as EmployeeWithTrust[];
  const beforeScores = withTrust.map((e) =>
    "trust" in e ? e.trust.trustScore : (e as { trustScore: number }).trustScore
  );
  const afterScores =
    simulatedAfter ??
    withTrust.map((e) =>
      "trust" in e
        ? simulateTrust(e.trust, {
            addedReviews: [
              {
                id: "team",
                source: "supervisor",
                weight: 1,
                timestamp: Date.now(),
              },
            ],
          }).trustScore
        : (e as { trustScore: number }).trustScore
    );
  const beforeAvg =
    beforeScores.length === 0 ? 0 : beforeScores.reduce((a, b) => a + b, 0) / beforeScores.length;
  const afterAvg =
    afterScores.length === 0 ? 0 : afterScores.reduce((a, b) => a + b, 0) / afterScores.length;
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
