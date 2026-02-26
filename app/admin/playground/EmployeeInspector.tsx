"use client";

import { simulateTrust } from "@/lib/trust/simulator";
import { useState } from "react";
import type { TrustSnapshot, SimulationDelta } from "@/lib/trust/types";
import {
  EMPLOYEE_PROFILE,
  CURRENT_TRUST_STATE,
  SIMULATED_CHANGES,
  SIMULATED_OUTCOME,
} from "@/lib/playground/copy";
import { IndustrySelector } from "./IndustrySelector";
import type { Industry } from "@/lib/industries";

type Employee = { id: string; name: string; trust: TrustSnapshot };

type Props = {
  employee: Employee;
  threshold: number;
  industry?: Industry;
  onIndustryChange?: (industry: Industry) => void;
};

export function EmployeeInspector({
  employee,
  threshold,
  industry,
  onIndustryChange,
}: Props) {
  const [delta, setDelta] = useState<SimulationDelta>({});
  const simulated = simulateTrust(employee.trust, delta);
  const verificationCount = employee.trust.reviews.length;
  const riskFlags = 0; // immutable record; no flags in snapshot for now
  const meetsThreshold = simulated.trustScore >= threshold;
  const riskDelta = 0; // derived if we had risk flags before/after

  const addVerification = () => {
    setDelta((d) => ({
      ...d,
      addedReviews: [
        ...(d.addedReviews ?? []),
        {
          id: crypto.randomUUID(),
          source: "supervisor" as const,
          weight: 2,
          timestamp: Date.now(),
        },
      ],
    }));
  };

  const removeLastSignal = () => {
    setDelta((d) => {
      const added = d.addedReviews ?? [];
      if (added.length === 0) return d;
      return {
        ...d,
        addedReviews: added.slice(0, -1),
      };
    });
  };

  const resetSimulation = () => setDelta({});

  const addedCount = delta.addedReviews?.length ?? 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{employee.name}</h2>
        <h3 className="text-sm font-medium text-slate-700 mt-1">{EMPLOYEE_PROFILE.header}</h3>
        <p className="text-sm text-slate-600 mt-0.5">{EMPLOYEE_PROFILE.helperText}</p>
      </div>

      {/* Current Trust State */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-900">{CURRENT_TRUST_STATE.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5">{CURRENT_TRUST_STATE.subtext}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">{CURRENT_TRUST_STATE.trustScore}</dt>
          <dd className="font-medium text-slate-900">{employee.trust.trustScore}</dd>
          <dt className="text-slate-500">{CURRENT_TRUST_STATE.confidenceScore}</dt>
          <dd className="font-medium text-slate-900">{employee.trust.confidenceScore}</dd>
          <dt className="text-slate-500">{CURRENT_TRUST_STATE.networkStrength}</dt>
          <dd className="font-medium text-slate-900">{employee.trust.networkStrength}</dd>
          <dt className="text-slate-500">{CURRENT_TRUST_STATE.verificationCount}</dt>
          <dd className="font-medium text-slate-900">{verificationCount}</dd>
          <dt className="text-slate-500">{CURRENT_TRUST_STATE.riskFlags}</dt>
          <dd className="font-medium text-slate-900">{riskFlags}</dd>
        </dl>
      </div>

      {/* Simulated Changes */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-900">{SIMULATED_CHANGES.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5">{SIMULATED_CHANGES.subtext}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addVerification}
            className="rounded bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-800"
          >
            {SIMULATED_CHANGES.addVerification}
          </button>
          <button
            type="button"
            onClick={removeLastSignal}
            disabled={addedCount === 0}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {SIMULATED_CHANGES.removeSignal}
          </button>
          {industry !== undefined && onIndustryChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{SIMULATED_CHANGES.adjustThreshold}</span>
              <IndustrySelector value={industry} onChange={onIndustryChange} />
            </div>
          )}
          <button
            type="button"
            onClick={resetSimulation}
            disabled={addedCount === 0}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {SIMULATED_CHANGES.resetSimulation}
          </button>
        </div>
      </div>

      {/* Simulated Outcome */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-900">{SIMULATED_OUTCOME.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5">{SIMULATED_OUTCOME.subtext}</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">{SIMULATED_OUTCOME.projectedTrustScore}</dt>
          <dd className="font-medium text-slate-900">{simulated.trustScore}</dd>
          <dt className="text-slate-500">{SIMULATED_OUTCOME.projectedConfidenceScore}</dt>
          <dd className="font-medium text-slate-900">{simulated.confidenceScore}</dd>
          <dt className="text-slate-500">{SIMULATED_OUTCOME.eligibilityImpact}</dt>
          <dd className="font-medium text-slate-900">
            {meetsThreshold ? "Meets Threshold" : "Below Threshold"}
          </dd>
          <dt className="text-slate-500">{SIMULATED_OUTCOME.riskDelta}</dt>
          <dd className="font-medium text-slate-900">{riskDelta}</dd>
        </dl>
      </div>
    </div>
  );
}
