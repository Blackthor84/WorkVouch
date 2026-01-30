"use client";

import { useState } from "react";
import { usePreview } from "@/lib/preview-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RevenueDemoState {
  fakeMRR: number;
  fakeRevenue: number;
  fakeChurnRate: number;
}

export default function DemoRevenueClient() {
  const { preview } = usePreview();
  const demoActive = Boolean(preview?.demoActive);

  const [demoState, setDemoState] = useState<RevenueDemoState>({
    fakeMRR: 2400,
    fakeRevenue: 28800,
    fakeChurnRate: 2.5,
  });

  const setNum = <K extends keyof RevenueDemoState>(key: K, value: number) => {
    console.log("[Demo Revenue] setNum", key, value);
    setDemoState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!demoActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">Revenue Simulator</h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6">
          Enable Elite Demo Mode to view this page. Use <code className="bg-black/10 dark:bg-white/10 px-1 rounded">?demo=elite</code> or activate from Hidden Features.
        </p>
        <Link href="/admin" onClick={() => console.log("[Demo Revenue] Back to Admin (placeholder) clicked")}>
          <Button type="button" variant="secondary">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  const { fakeMRR: mrr, fakeRevenue: revenue, fakeChurnRate: churn } = demoState;
  const employers = Math.round((revenue / 12) / (mrr / 10)) || 10;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">Fake Revenue Dashboard</h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">Elite Demo — display only, no backend</p>
        </div>
        <Link href="/admin" onClick={() => console.log("[Demo Revenue] Back to Admin clicked")}>
          <Button type="button" variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Fake MRR ($)</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={500}
              max={50000}
              step={100}
              value={mrr}
              onChange={(e) => setNum("fakeMRR", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">${mrr.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Fake Total Revenue ($)</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={5000}
              max={500000}
              step={1000}
              value={revenue}
              onChange={(e) => setNum("fakeRevenue", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">${revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Fake Churn %</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={churn}
              onChange={(e) => setNum("fakeChurnRate", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{churn}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Fake Active Employers</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{employers}</p>
            <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">Derived from MRR / revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Simple chart (MRR vs Churn)</h2>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-1">
            <div
              className="flex-1 bg-violet-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (mrr / 50000) * 100)}%` }}
              title={`MRR $${mrr}`}
            />
            <div
              className="flex-1 bg-amber-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (churn / 15) * 100)}%` }}
              title={`Churn ${churn}%`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-grey-medium dark:text-gray-400">
            <span>MRR</span>
            <span>Churn %</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
