"use client";

import { useState, useMemo } from "react";
import { runSimulation } from "@/lib/simulation/engine";
import type { PlanTier, SimulationInputs, SimulationOutput } from "@/lib/simulation/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function limitLabel(n: number): string {
  return n === Infinity ? "∞" : String(n);
}

export default function AdminSimulationSandbox() {
  const [plan, setPlan] = useState<PlanTier>("starter");
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [seats, setSeats] = useState(3);
  const [reportsUsed, setReportsUsed] = useState(5);
  const [searchesUsed, setSearchesUsed] = useState(8);
  const [advertiserImpressions, setAdvertiserImpressions] = useState(50000);
  const [advertiserCTR, setAdvertiserCTR] = useState(2.5);

  const input: SimulationInputs = useMemo(
    () => ({
      plan,
      seats,
      reportsUsed,
      searchesUsed,
      subscriptionActive,
      advertiserImpressions,
      advertiserCTR,
    }),
    [plan, seats, reportsUsed, searchesUsed, subscriptionActive, advertiserImpressions, advertiserCTR]
  );

  const result: SimulationOutput = runSimulation(input);

  const handleExportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ input, output: result }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workvouch-simulation-demo.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 mb-8 text-amber-800 dark:text-amber-200 text-sm font-medium">
        Simulation Mode — No Real Data Modified
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Admin Simulation Sandbox</h1>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleExportJson}>
            Export JSON
          </Button>
          <Link href="/admin">
            <Button variant="secondary">Back to Admin</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Inputs</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanTier)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              >
                <option value="starter">Starter</option>
                <option value="team">Team</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sub"
                checked={subscriptionActive}
                onChange={(e) => setSubscriptionActive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="sub" className="text-sm font-medium text-grey-dark dark:text-gray-200">
                subscriptionActive
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Seats: {seats}</label>
              <input type="range" min={0} max={50} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Reports used: {reportsUsed}</label>
              <input type="range" min={0} max={150} value={reportsUsed} onChange={(e) => setReportsUsed(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Searches used: {searchesUsed}</label>
              <input type="range" min={0} max={200} value={searchesUsed} onChange={(e) => setSearchesUsed(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Ad impressions: {advertiserImpressions.toLocaleString()}</label>
              <input type="range" min={0} max={200000} step={1000} value={advertiserImpressions} onChange={(e) => setAdvertiserImpressions(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Ad CTR %: {advertiserCTR}</label>
              <input type="range" min={0} max={10} step={0.1} value={advertiserCTR} onChange={(e) => setAdvertiserCTR(Number(e.target.value))} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Output</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {result.overLimit && (
                <span className="rounded-full bg-red-500/20 text-red-700 dark:text-red-300 px-3 py-1 text-sm font-medium">Over limit</span>
              )}
              {result.subscriptionExpired && (
                <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 text-sm font-medium">Subscription expired</span>
              )}
              {!result.overLimit && !result.subscriptionExpired && (
                <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm font-medium">Within limits</span>
              )}
            </div>
            <ul className="space-y-2 text-sm text-grey-dark dark:text-gray-200">
              <li>Allowed reports: {limitLabel(result.allowedReports)}</li>
              <li>Allowed searches: {limitLabel(result.allowedSearches)}</li>
              <li>Seats allowed: {limitLabel(result.seatsAllowed)}</li>
              <li>Rehire probability: {result.rehireProbability}%</li>
              <li>Team compatibility: {result.teamCompatibilityScore}%</li>
              <li>Workforce risk: {result.workforceRiskScore}%</li>
              {result.estimatedRevenue !== undefined && (
                <li>Estimated revenue: ${result.estimatedRevenue.toLocaleString()}</li>
              )}
              {result.estimatedAdROI !== undefined && (
                <li>Ad ROI: {result.estimatedAdROI}x</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
