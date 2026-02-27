"use client";

import { useState, useCallback } from "react";
import {
  createFakeEmployer,
  createFakeEmployee,
  bulkCreateFakeEmployees,
  type Employer,
  type Employee,
} from "@/lib/simulation-engine";
import { ALL_INDUSTRIES } from "@/lib/industries";
const ROLES = ["RN", "Manager", "Engineer", "Analyst", "Support"];
const DEPARTMENTS = ["Nursing", "Engineering", "Operations", "HR"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SimulationDataBuilder() {
  const [fakeEmployers, setFakeEmployers] = useState<Employer[]>([]);
  const [fakeEmployees, setFakeEmployees] = useState<Employee[]>([]);
  const [bulkCount, setBulkCount] = useState(50);

  const addFakeEmployer = useCallback(() => {
    const employer = createFakeEmployer(
      {
        name: `Simulated Employer ${fakeEmployers.length + 1}`,
        industry: ALL_INDUSTRIES[randomInt(0, ALL_INDUSTRIES.length - 1)],
        threshold: randomInt(60, 90),
        decayRate: 0.9 + Math.random() * 0.2,
        supervisorWeight: 1.2 + Math.random() * 0.6,
        riskTolerance: randomInt(1, 5),
      },
      Date.now() + fakeEmployers.length
    );
    setFakeEmployers((prev) => [...prev, employer]);
  }, [fakeEmployers.length]);

  const addFakeEmployee = useCallback(() => {
    const employee = createFakeEmployee(
      {
        name: `Simulated Employee ${fakeEmployees.length + 1}`,
        role: ROLES[randomInt(0, ROLES.length - 1)],
        department: DEPARTMENTS[randomInt(0, DEPARTMENTS.length - 1)],
        trustScoreMin: 40,
        trustScoreMax: 85,
        confidenceScoreMin: 50,
        confidenceScoreMax: 95,
        reviewCount: randomInt(1, 10),
        reviewSourceMix: { peer: 0.4, supervisor: 0.3, manager: 0.1, synthetic: 0.1, self: 0.05, external: 0.05 },
      },
      Date.now() + fakeEmployees.length
    );
    setFakeEmployees((prev) => [...prev, employee]);
  }, [fakeEmployees.length]);

  const bulkGenerate = useCallback(() => {
    const n = Math.min(1000, Math.max(10, bulkCount));
    const next = bulkCreateFakeEmployees(
      {
        namePrefix: "Simulated Employee",
        role: ROLES[0],
        department: DEPARTMENTS[0],
        trustScoreMin: 30,
        trustScoreMax: 90,
        confidenceScoreMin: 40,
        confidenceScoreMax: 95,
        reviewCount: randomInt(0, 12),
        reviewSourceMix: { peer: 0.4, supervisor: 0.3, manager: 0.1, synthetic: 0.1, self: 0.05, external: 0.05 },
      },
      n
    );
    setFakeEmployees((prev) => [...prev, ...next]);
  }, [bulkCount]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Simulation Data Builder</h2>
      <p className="text-sm text-slate-600">
        Create fake employers and employees via the engine. All data feeds into engines; no placeholders.
      </p>

      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        All data is SIMULATED. Employers can fully control fake employers, fake employees, and distributions.
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Fake employers</h3>
        <button
          type="button"
          onClick={addFakeEmployer}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Add fake employer
        </button>
        <ul className="mt-2 space-y-1 text-sm">
          {fakeEmployers.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="font-mono text-amber-700 text-xs">SIMULATED</span>
              {e.name} — {e.industry}, threshold {e.policy.threshold}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Fake employees</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={addFakeEmployee}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Add one fake employee
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span>Bulk count (10–1000):</span>
            <input
              type="number"
              min={10}
              max={1000}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value) || 50)}
              className="w-20 border rounded px-2 py-1"
            />
          </label>
          <button
            type="button"
            onClick={bulkGenerate}
            className="rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
          >
            Bulk-generate
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Total: {fakeEmployees.length} simulated employees (engine-generated)</p>
        <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-auto">
          {fakeEmployees.slice(0, 20).map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="font-mono text-amber-700 text-xs">SIMULATED</span>
              {e.name} — {e.role}, {e.department}, trust {e.snapshot.trustScore}
              {e.snapshot.engineOutputs != null && (
                <span className="text-slate-500">
                  (risk {e.snapshot.engineOutputs.riskScore}, fragility {e.snapshot.engineOutputs.fragilityScore})
                </span>
              )}
            </li>
          ))}
          {fakeEmployees.length > 20 && <li className="text-slate-500">… and {fakeEmployees.length - 20} more</li>}
        </ul>
      </div>
    </section>
  );
}
