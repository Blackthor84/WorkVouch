"use client";

import { simulateTrust } from "@/lib/trust/simulator";
import type { TrustSnapshot } from "@/lib/trust/types";
import type { SimLike } from "@/lib/trust/simLike";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";

type Employee = {
  id: string;
  name: string;
  department?: string;
  role?: string;
  trust: { trustScore: number; confidenceScore: number; networkStrength: number; reviews: unknown[] };
};

export function EmployeeInspector({
  employee,
  sim,
  execute: executeProp,
}: {
  employee: Employee;
  sim: SimLike;
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
}) {
  const simulated = simulateTrust(employee.trust as TrustSnapshot, sim.delta ?? { addedReviews: [], removedReviewIds: [] });

  const addSupervisorVerification = () => {
    const action: SimulationAction = {
      type: "add_review",
      review: {
        id: crypto.randomUUID(),
        source: "supervisor",
        weight: 2,
        timestamp: Date.now(),
      },
    };
    (executeProp ? executeProp(action) : executeAction(sim, action));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-slate-900">{employee.name}</h3>

      <div>
        <strong className="text-sm text-slate-700">Current</strong>
        <pre className="mt-1 text-xs bg-slate-50 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(employee.trust, null, 2)}
        </pre>
      </div>

      <div>
        <strong className="text-sm text-slate-700">Simulated</strong>
        <pre className="mt-1 text-xs bg-sky-50 p-2 rounded overflow-auto max-h-32">
          {JSON.stringify(simulated, null, 2)}
        </pre>
      </div>

      <button
        type="button"
        onClick={addSupervisorVerification}
        className="rounded bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-800"
      >
        Add Supervisor Verification
      </button>
    </div>
  );
}
