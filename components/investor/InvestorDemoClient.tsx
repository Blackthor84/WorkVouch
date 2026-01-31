"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import RevenueDemoClient from "@/components/admin/RevenueDemoClient";
import AdminSimulationSandbox from "@/components/admin/AdminSimulationSandbox";
import DemoAdsClient from "@/app/admin/demo/ads/demo-ads-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function GrowthMetric({ end, prefix = "", suffix = "", decimals = 0 }: { end: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const duration = 1500;
    const startTime = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setValue(end * eased);
      if (t >= 1) done.current = true;
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

export default function InvestorDemoClient() {
  const [mrr, setMrr] = useState(124000);

  useEffect(() => {
    const id = setInterval(() => {
      setMrr((prev) => prev + Math.round((Math.random() - 0.3) * 2000));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const simulationEnabled = process.env.NEXT_PUBLIC_SIMULATION_MODE === "true";

  if (!simulationEnabled) {
    return (
      <Card className="border-amber-500/50 bg-amber-500/10">
        <CardContent className="py-8 text-center">
          <p className="text-amber-200 font-medium">
            Simulation mode is disabled. Set <code className="rounded bg-black/20 px-1">NEXT_PUBLIC_SIMULATION_MODE=true</code> to enable investor demo content.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">Revenue Simulation Dashboard</h2>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
          <RevenueDemoClient />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">Growth Simulation Metrics</h2>
        <Card className="border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-200">Simulated growth (live tick)</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">MRR</p>
                <p className="text-2xl font-bold text-emerald-400"><GrowthMetric end={mrr} prefix="$" /></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Growth</p>
                <p className="text-2xl font-bold text-slate-200"><GrowthMetric end={18.4} suffix="%" decimals={1} /></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">LTV</p>
                <p className="text-2xl font-bold text-slate-200"><GrowthMetric end={2840} prefix="$" /></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">CAC</p>
                <p className="text-2xl font-bold text-slate-200"><GrowthMetric end={420} prefix="$" /></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Projected ARR</p>
                <p className="text-2xl font-bold text-emerald-400"><GrowthMetric end={1488000} prefix="$" /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">Advertiser ROI Demo</h2>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
          <DemoAdsClient standalone />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">Feature Flag Status Panel</h2>
        <Card className="border-slate-700 bg-slate-900/80">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-200">Feature flags</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Feature flags are managed in Hidden Features. This demo does not modify real flags.</p>
            <Link
              href="/admin/hidden-features"
              className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
            >
              Open Hidden Features →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">Simulation Controls</h2>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4">
          <AdminSimulationSandbox />
        </div>
      </section>
    </>
  );
}
