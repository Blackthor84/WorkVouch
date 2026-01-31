"use client";

import { useMemo } from "react";
import Link from "next/link";
import { runSimulation } from "@/lib/simulation/engine";
import { getMonthlyPrice } from "@/lib/simulation/pricing";
import type { PlanTier, SimulationInputs } from "@/lib/simulation/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLANS: PlanTier[] = ["starter", "team", "pro", "enterprise"];

/** Deterministic pseudo-random in [0, 1) from seed. */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function generateCompanies(count: number): SimulationInputs[] {
  const companies: SimulationInputs[] = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => seeded(i * 137 + n);
    const plan = PLANS[Math.floor(r(1) * PLANS.length)] as PlanTier;
    const seats = plan === "enterprise" ? 50 + Math.floor(r(2) * 150) : Math.max(1, Math.floor(r(2) * 25));
    const reportsUsed = Math.floor(r(3) * 80);
    const searchesUsed = Math.floor(r(4) * 100);
    const subscriptionActive = r(5) > 0.12; // ~12% churned
    const hasAds = r(6) > 0.6; // ~40% have ad campaigns
    const advertiserImpressions = hasAds ? Math.floor(10000 + r(7) * 90000) : undefined;
    const advertiserCTR = hasAds ? 1.2 + r(8) * 2.8 : undefined;

    companies.push({
      plan,
      seats,
      reportsUsed,
      searchesUsed,
      subscriptionActive,
      ...(advertiserImpressions != null && advertiserCTR != null
        ? { advertiserImpressions, advertiserCTR }
        : {}),
    });
  }
  return companies;
}

export default function RevenueDemoClient() {
  const { totalMRR, arpu, churnPercent, totalAdRevenue, activeCount, churnedCount } = useMemo(() => {
    const companies = generateCompanies(100);
    let totalMRR = 0;
    let totalAdRevenue = 0;
    let activeCount = 0;
    let churnedCount = 0;

    companies.forEach((input) => {
      const out = runSimulation(input);
      if (input.subscriptionActive) {
        totalMRR += getMonthlyPrice(input.plan);
        activeCount++;
      } else {
        churnedCount++;
      }
      if (out.estimatedRevenue != null) {
        totalAdRevenue += out.estimatedRevenue;
      }
    });

    const churnPercent = companies.length > 0 ? (churnedCount / companies.length) * 100 : 0;
    const arpu = activeCount > 0 ? totalMRR / activeCount : 0;

    return {
      totalMRR,
      arpu,
      churnPercent,
      totalAdRevenue,
      activeCount,
      churnedCount,
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 mb-6 text-amber-800 dark:text-amber-200 text-sm font-medium">
        Simulation Mode — 100 simulated companies. No real data modified.
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Revenue Dashboard (Investor Demo)</h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">MRR, ARPU, churn & ad revenue from runSimulation()</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">Total MRR</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              ${totalMRR.toLocaleString()}
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">Monthly recurring revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">ARPU</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              ${arpu.toFixed(2)}
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">Avg revenue per active account</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">Simulated Churn</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {churnPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">{churnedCount} of 100 inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">Total Ad Revenue</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${totalAdRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">From simulated ad campaigns</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Summary</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-grey-dark dark:text-gray-300">
          <p><strong>Active accounts:</strong> {activeCount}</p>
          <p><strong>Churned (simulated):</strong> {churnedCount}</p>
          <p><strong>Total MRR:</strong> ${totalMRR.toLocaleString()} (subscription only)</p>
          <p><strong>Ad revenue (one-time projection):</strong> ${totalAdRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-grey-medium dark:text-gray-400 pt-2">All metrics derived from runSimulation() across 100 synthetic companies. No database writes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
