"use client";

import type { EmployerCandidateRow } from "@/lib/actions/employer/employerCandidateSearch";

function hiringRisk(baseCost: number, trustScore: number): number {
  const t = Math.min(100, Math.max(0, trustScore));
  return Math.round(baseCost * (1 - t / 100));
}

type Props = {
  candidateA: EmployerCandidateRow | null;
  candidateB: EmployerCandidateRow | null;
  baseCost: number;
  onBaseCostChange: (v: number) => void;
};

/**
 * Side-by-side comparison of two candidates with estimated hiring risk.
 */
export function CandidateCompare({
  candidateA,
  candidateB,
  baseCost,
  onBaseCostChange,
}: Props) {
  const safeBase = Number.isFinite(baseCost) && baseCost >= 0 ? baseCost : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
        Compare candidates
      </h3>
      <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
        Select two profiles above, then compare name, trust, and estimated hiring
        risk. Risk uses: baseline cost × (1 − trust / 100).
      </p>

      <label className="mt-4 block text-sm font-medium text-grey-dark dark:text-gray-300">
        Baseline bad-hire cost ($)
        <input
          type="number"
          min={0}
          step={1000}
          value={safeBase}
          onChange={(e) => onBaseCostChange(Math.max(0, Number(e.target.value)))}
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-grey-dark dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
        />
      </label>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[candidateA, candidateB].map((c, i) => {
          const label = i === 0 ? "Candidate A" : "Candidate B";
          const risk = c ? hiringRisk(safeBase, c.trust_score) : null;
          return (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-gray-600 dark:bg-gray-950/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
              </p>
              {!c ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Click a card in the explorer to select (max two).
                </p>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.full_name ?? "—"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Trust score:{" "}
                    <span className="font-medium tabular-nums">
                      {c.trust_score} / 100
                    </span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Est. hiring risk:{" "}
                    <span className="font-semibold text-amber-800 dark:text-amber-200 tabular-nums">
                      ${risk?.toLocaleString() ?? "—"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {candidateA && candidateB && (
        <p className="mt-4 text-sm text-grey-medium dark:text-gray-400">
          Risk gap:{" "}
          <span className="font-semibold text-grey-dark dark:text-gray-200">
            $
            {Math.abs(
              hiringRisk(safeBase, candidateA.trust_score) -
                hiringRisk(safeBase, candidateB.trust_score),
            ).toLocaleString()}
          </span>{" "}
          between selections at this baseline.
        </p>
      )}
    </div>
  );
}
