"use client";

import { useState, useMemo } from "react";
import { runSimulation } from "@/lib/simulation/engine";
import type { PlanTier } from "@/lib/simulation/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLANS: PlanTier[] = ["free", "starter", "pro", "custom"];

export default function AdminDemoAnalyticsClient() {
  const [plan, setPlan] = useState<PlanTier>("pro");
  const [seats, setSeats] = useState(10);
  const [reportsUsed, setReportsUsed] = useState(45);
  const [searchesUsed, setSearchesUsed] = useState(60);

  const result = useMemo(
    () =>
      runSimulation({
        plan,
        seats,
        reportsUsed,
        searchesUsed,
        subscriptionActive: true,
      }),
    [plan, seats, reportsUsed, searchesUsed]
  );

  const limitLabel = (n: number) => (n === Infinity ? "∞" : n);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            Analytics Simulator
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Pure simulation — rehire probability, team compatibility, workforce risk. No database, no feature flags.
          </p>
        </div>
        <Button variant="secondary" href="/admin/demo">
          Back to Demo Hub
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 mb-8 text-amber-800 dark:text-amber-200 text-sm font-medium">
        Demo Mode — All data is simulated. No real user data.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
              Inputs (simulated)
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanTier)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Seats: {seats}</label>
              <input
                type="range"
                min={1}
                max={50}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Reports used: {reportsUsed}</label>
              <input
                type="range"
                min={0}
                max={150}
                value={reportsUsed}
                onChange={(e) => setReportsUsed(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Searches used: {searchesUsed}</label>
              <input
                type="range"
                min={0}
                max={200}
                value={searchesUsed}
                onChange={(e) => setSearchesUsed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                Plan limits (simulated)
              </h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-grey-medium dark:text-gray-400">Reports</span>
                <span className="font-medium text-grey-dark dark:text-gray-200">{limitLabel(result.allowedReports)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-grey-medium dark:text-gray-400">Searches</span>
                <span className="font-medium text-grey-dark dark:text-gray-200">{limitLabel(result.allowedSearches)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-grey-medium dark:text-gray-400">Seats</span>
                <span className="font-medium text-grey-dark dark:text-gray-200">{limitLabel(result.seatsAllowed)}</span>
              </p>
              {result.overLimit && (
                <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">Over limit</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="transition-shadow hover:shadow-lg" hover>
              <CardHeader>
                <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400">Rehire probability</h3>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{result.rehireProbability}%</p>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg" hover>
              <CardHeader>
                <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400">Team compatibility</h3>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.teamCompatibilityScore}</p>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg" hover>
              <CardHeader>
                <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400">Workforce risk</h3>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{result.workforceRiskScore}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
