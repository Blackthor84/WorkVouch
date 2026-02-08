"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Employer = { id: string; company_name?: string; industry?: string; plan_tier?: string };
type Employee = { id: string; full_name?: string; industry?: string };
type IntelOutput = { employee_id: string; profile_strength?: number | null };

interface EntitiesPanelProps {
  employers: Employer[];
  employees: Employee[];
  intelByEmployeeId: Map<string, IntelOutput>;
  currentSandboxId: string | null;
  loading: boolean;
  genEmployerLoading: boolean;
  genEmployeeLoading: boolean;
  employerName: string;
  setEmployerName: (v: string) => void;
  employerIndustry: string;
  setEmployerIndustry: (v: string) => void;
  employerPlanTier: string;
  setEmployerPlanTier: (v: string) => void;
  employeeName: string;
  setEmployeeName: (v: string) => void;
  employeeIndustry: string;
  setEmployeeIndustry: (v: string) => void;
  onGenerateEmployer: () => void;
  onGenerateEmployee: () => void;
}

export function EntitiesPanel({
  employers,
  employees,
  intelByEmployeeId,
  currentSandboxId,
  loading,
  genEmployerLoading,
  genEmployeeLoading,
  employerName,
  setEmployerName,
  employerIndustry,
  setEmployerIndustry,
  employerPlanTier,
  setEmployerPlanTier,
  employeeName,
  setEmployeeName,
  employeeIndustry,
  setEmployeeIndustry,
  onGenerateEmployer,
  onGenerateEmployee,
}: EntitiesPanelProps) {
  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-600 bg-slate-800/70">
      <div className="flex-none border-b border-slate-600 px-3 py-2">
        <h2 className="text-sm font-semibold text-slate-200">Entities</h2>
        <p className="text-xs text-slate-400">
          {employers.length} employers · {employees.length} employees
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* Employers table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Employers ({employers.length})
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-800/80">
            <table className="w-full min-w-[200px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-slate-300">
                  <th className="px-2 py-1.5 font-medium">Company</th>
                  <th className="px-2 py-1.5 font-medium">Industry</th>
                  <th className="px-2 py-1.5 font-medium">Plan</th>
                  <th className="w-8 px-1 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {employers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-slate-500">
                      No employers yet
                    </td>
                  </tr>
                )}
                {employers.map((e) => (
                  <tr key={e.id} className="border-b border-slate-700/80 last:border-0">
                    <td className="px-2 py-1.5 text-slate-100">
                      {e.company_name ?? e.id.slice(0, 8)}
                    </td>
                    <td className="px-2 py-1.5 text-slate-300">{e.industry ?? "—"}</td>
                    <td className="px-2 py-1.5 text-slate-300">{e.plan_tier ?? "—"}</td>
                    <td className="px-1 py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-1.5 text-slate-400 hover:text-red-300"
                        disabled
                        title="Delete employer (requires backend support)"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 space-y-2 rounded-lg border border-slate-600 bg-slate-800/60 p-2">
            <div>
              <Label className="text-xs font-medium text-slate-300">Company name</Label>
              <Input
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Name"
                className="mt-0.5 h-8 border-slate-600 bg-slate-800 text-slate-100 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-300">Industry</Label>
              <Input
                value={employerIndustry}
                onChange={(e) => setEmployerIndustry(e.target.value)}
                placeholder="Industry"
                className="mt-0.5 h-8 border-slate-600 bg-slate-800 text-slate-100 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-300">Plan tier</Label>
              <select
                value={employerPlanTier}
                onChange={(e) => setEmployerPlanTier(e.target.value)}
                className="mt-0.5 h-8 w-full rounded border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={onGenerateEmployer}
              disabled={loading || !currentSandboxId || genEmployerLoading}
            >
              {genEmployerLoading ? "…" : "Generate employer"}
            </Button>
          </div>
        </div>

        {/* Employees table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Employees ({employees.length})
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-800/80">
            <table className="w-full min-w-[200px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-600 text-slate-300">
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  <th className="px-2 py-1.5 font-medium">Industry</th>
                  <th className="px-2 py-1.5 font-medium">Score</th>
                  <th className="w-8 px-1 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-slate-500">
                      No employees yet
                    </td>
                  </tr>
                )}
                {employees.map((e) => {
                  const intel = intelByEmployeeId.get(e.id);
                  const score =
                    intel?.profile_strength != null
                      ? Number(intel.profile_strength).toFixed(0)
                      : "—";
                  return (
                    <tr key={e.id} className="border-b border-slate-700/80 last:border-0">
                      <td className="px-2 py-1.5 font-medium text-slate-100">
                        {e.full_name ?? e.id.slice(0, 8)}
                      </td>
                      <td className="px-2 py-1.5 text-slate-300">{e.industry ?? "—"}</td>
                      <td className="px-2 py-1.5 text-slate-300">{score}</td>
                      <td className="px-1 py-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-slate-400 hover:text-red-300"
                          disabled
                          title="Delete employee (requires backend support)"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 space-y-2 rounded-lg border border-slate-600 bg-slate-800/60 p-2">
            <div>
              <Label className="text-xs font-medium text-slate-300">Full name</Label>
              <Input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Name"
                className="mt-0.5 h-8 border-slate-600 bg-slate-800 text-slate-100 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-300">Industry</Label>
              <Input
                value={employeeIndustry}
                onChange={(e) => setEmployeeIndustry(e.target.value)}
                placeholder="Industry"
                className="mt-0.5 h-8 border-slate-600 bg-slate-800 text-slate-100 text-sm"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={onGenerateEmployee}
              disabled={loading || !currentSandboxId || genEmployeeLoading}
            >
              {genEmployeeLoading ? "…" : "Generate employee"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
