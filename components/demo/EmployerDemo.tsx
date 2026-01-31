"use client";

import { useState, useEffect } from "react";

interface EmployerDemoProps {
  companyName: string;
  simulationMode: boolean;
}

export function EmployerDemo({ companyName, simulationMode }: EmployerDemoProps) {
  const [activeEmployees, setActiveEmployees] = useState(24);
  const [pendingVerifications, setPendingVerifications] = useState(3);
  const [reportsUsed, setReportsUsed] = useState(28);
  const reportsLimit = 40;
  const displayCompany = companyName.trim() || "Your Company";

  useEffect(() => {
    if (!simulationMode) return;
    const id = setInterval(() => {
      setActiveEmployees((e) => Math.min(40, Math.max(18, e + Math.round((Math.random() - 0.5) * 4))));
      setPendingVerifications((v) => Math.min(8, Math.max(1, v + Math.round((Math.random() - 0.6) * 2))));
      setReportsUsed((r) => Math.min(reportsLimit, Math.max(20, r + Math.round((Math.random() - 0.5) * 6))));
    }, 3000);
    return () => clearInterval(id);
  }, [simulationMode, reportsLimit]);

  const reportsPct = (reportsUsed / reportsLimit) * 100;
  const fitScores = [40, 65, 55, 80, 70, 90, 75, 85, 78, 88];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <p className="text-lg font-semibold text-slate-900">{displayCompany}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Employees</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{activeEmployees}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Verifications</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{pendingVerifications}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reports Used</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{reportsUsed}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Plan Limit</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{reportsLimit}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-3">Reports used vs plan limit</p>
        <div className="h-4 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700 ease-out"
            style={{ width: `${reportsPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{reportsUsed} / {reportsLimit}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500 mb-4">Fit Score</p>
        <div className="h-32 flex items-end gap-1">
          {fitScores.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-indigo-400 min-w-[8px] transition-all duration-500 ease-out"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">Last 10 candidates</p>
      </div>
    </div>
  );
}
