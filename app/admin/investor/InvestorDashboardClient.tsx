"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RealCounts = {
  totalUsers: number;
  totalEmployers: number;
  verificationVolume: number;
  demoAccounts: number;
  realUsers: number;
};

const GROWTH_MONTHLY = 0.08;
const MRR_PER_EMPLOYER = 180;
const LTV_BASE = 2840;
const CAC_BASE = 420;
const CHURN_BASE = 0.025;
const NETWORK_MULTIPLIER = 1.12;

function useSimulated(realCounts: RealCounts, simulated: boolean) {
  return useMemo(() => {
    const real = realCounts;
    if (!simulated) {
      const mrr = real.totalEmployers * MRR_PER_EMPLOYER;
      return {
        totalUsers: real.realUsers,
        totalEmployers: real.totalEmployers,
        verificationVolume: real.verificationVolume,
        mrr,
        riskAdoptionPercent: Math.min(100, real.totalEmployers * 4),
        enterprisePipeline: Math.round(real.totalEmployers * 0.15 * 12000),
        ltv: LTV_BASE,
        cac: CAC_BASE,
        churnPercent: CHURN_BASE * 100,
        networkEffect: 1,
        projectedMonths: [] as { month: number; mrr: number; arr: number }[],
      };
    }
    const months = 36;
    const projectedMonths: { month: number; mrr: number; arr: number }[] = [];
    let u = real.realUsers;
    let e = real.totalEmployers;
    let v = real.verificationVolume;
    let mrr = e * MRR_PER_EMPLOYER;
    for (let m = 0; m <= months; m++) {
      if (m > 0) {
        u = Math.round(u * (1 + GROWTH_MONTHLY * NETWORK_MULTIPLIER));
        e = Math.round(e * (1 + GROWTH_MONTHLY * 1.05));
        v = Math.round(v * (1 + GROWTH_MONTHLY * 1.2));
        mrr = e * MRR_PER_EMPLOYER;
      }
      projectedMonths.push({ month: m, mrr, arr: mrr * 12 });
    }
    const last = projectedMonths[projectedMonths.length - 1];
    return {
      totalUsers: u,
      totalEmployers: e,
      verificationVolume: v,
      mrr: last?.mrr ?? mrr,
      riskAdoptionPercent: Math.min(100, e * 3.5),
      enterprisePipeline: Math.round(e * 0.18 * 12000),
      ltv: LTV_BASE * (1 - CHURN_BASE * 6),
      cac: CAC_BASE * 0.85,
      churnPercent: CHURN_BASE * 100 * 0.9,
      networkEffect: NETWORK_MULTIPLIER,
      projectedMonths,
    };
  }, [realCounts, simulated]);
}

export default function InvestorDashboardClient({ realCounts }: { realCounts: RealCounts }) {
  const [mode, setMode] = useState<"real" | "simulated">("real");
  const simulated = mode === "simulated";
  const metrics = useSimulated(realCounts, simulated);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Investor Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-600 bg-slate-800/80 p-1">
            <button
              type="button"
              onClick={() => setMode("real")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${!simulated ? "bg-slate-600 text-white" : "text-slate-300 hover:text-white"}`}
            >
              Real Data
            </button>
            <button
              type="button"
              onClick={() => setMode("simulated")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${simulated ? "bg-slate-600 text-white" : "text-slate-300 hover:text-white"}`}
            >
              Simulated Growth
            </button>
          </div>
          <Link href="/admin">
            <Button variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">Back to Admin</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Platform users</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</p>
            {simulated && <p className="text-xs text-slate-300 mt-1">Projected</p>}
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Employers</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.totalEmployers.toLocaleString()}</p>
            {simulated && <p className="text-xs text-slate-300 mt-1">Projected</p>}
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Verification volume</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.verificationVolume.toLocaleString()}</p>
            {simulated && <p className="text-xs text-slate-300 mt-1">Trend</p>}
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">MRR</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">${Math.round(metrics.mrr).toLocaleString()}</p>
            {simulated && <p className="text-xs text-slate-300 mt-1">Simulated</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Risk intelligence adoption %</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{Math.round(metrics.riskAdoptionPercent)}%</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Enterprise pipeline value</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${metrics.enterprisePipeline.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">LTV</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${Math.round(metrics.ltv).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">CAC</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${Math.round(metrics.cac).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Churn (simulated)</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.churnPercent.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-700 bg-[#111827] rounded-2xl shadow-lg">
          <CardHeader className="pb-1 text-sm font-medium text-slate-200">Network effect index</CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.networkEffect.toFixed(2)}x</p>
            <p className="text-xs text-slate-300 mt-1">Growth multiplier</p>
          </CardContent>
        </Card>
      </div>

      {simulated && metrics.projectedMonths.length > 0 && (
        <Card className="mt-6 border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-200">Projected revenue (12–36 months)</h2>
            <p className="text-sm text-slate-300">Simulated growth curve. No DB changes.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-0.5">
              {metrics.projectedMonths.filter((_, i) => i % 3 === 0 || i === metrics.projectedMonths.length - 1).map((point, i) => (
                <div
                  key={point.month}
                  className="flex-1 min-w-0 rounded-t bg-emerald-500/60 hover:bg-emerald-500/80 transition-colors"
                  style={{ height: `${Math.min(100, (point.arr / (metrics.projectedMonths[metrics.projectedMonths.length - 1]?.arr ?? 1)) * 100)}%` }}
                  title={`Month ${point.month}: ARR $${point.arr.toLocaleString()}`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-300">
              <span>Now</span>
              <span>36 mo: ${(metrics.projectedMonths[metrics.projectedMonths.length - 1]?.arr ?? 0).toLocaleString()} ARR</span>
            </div>
          </CardContent>
        </Card>
      )}

      {simulated && (
        <Card className="mt-6 border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-200">Enterprise upgrade conversion (simulated)</h2>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">~18% of employers projected to enterprise tier in growth model.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
