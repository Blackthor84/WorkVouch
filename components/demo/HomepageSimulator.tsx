"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { runSimulation } from "@/lib/simulation/engine";
import type { PlanTier, SimulationOutput } from "@/lib/simulation/types";

function AnimatedMetric({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Math.round(value);
    const step = target > display ? 1 : -1;
    const id = setInterval(() => {
      setDisplay((d) => {
        if (d === target) {
          clearInterval(id);
          return d;
        }
        return d + step;
      });
    }, 20);
    return () => clearInterval(id);
  }, [value]);
  return <span>{display}{suffix}</span>;
}

export default function HomepageSimulator() {
  const [plan, setPlan] = useState<PlanTier>("lite");
  const [seats, setSeats] = useState(2);
  const [reportsUsed, setReportsUsed] = useState(3);
  const [searchesUsed, setSearchesUsed] = useState(5);

  const result: SimulationOutput = runSimulation({
    plan,
    seats,
    reportsUsed,
    searchesUsed,
    subscriptionActive: true,
  });

  const limitLabel = (n: number) => (n === Infinity ? "∞" : n);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          See How WorkVouch Works
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Simulate plans and metrics — no account required. Fully client-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#1A1F2B] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Plan & usage</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as PlanTier)}
                  className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
                >
                  <option value="lite">Lite</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
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
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#1A1F2B] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Plan limits</h2>
            <ul className="space-y-2 text-sm text-grey-medium dark:text-gray-400">
              <li>Reports: {reportsUsed} / {limitLabel(result.allowedReports)}</li>
              <li>Searches: {searchesUsed} / {limitLabel(result.allowedSearches)}</li>
              <li>Seats: {seats} / {limitLabel(result.seatsAllowed)}</li>
            </ul>
            {result.overLimit && (
              <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 px-3 py-2 text-sm font-medium">
                Over limit
              </div>
            )}
          </div>

          <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#1A1F2B] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Metrics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-grey-medium dark:text-gray-400 uppercase tracking-wide">Rehire probability</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  <AnimatedMetric value={result.rehireProbability} suffix="%" />
                </p>
              </div>
              <div>
                <p className="text-xs text-grey-medium dark:text-gray-400 uppercase tracking-wide">Team compatibility</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  <AnimatedMetric value={result.teamCompatibilityScore} suffix="%" />
                </p>
              </div>
              <div>
                <p className="text-xs text-grey-medium dark:text-gray-400 uppercase tracking-wide">Workforce risk</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  <AnimatedMetric value={result.workforceRiskScore} suffix="%" />
                </p>
              </div>
            </div>
          </div>

          {result.overLimit && (
            <div className="rounded-lg bg-red-500/15 border border-red-500/40 px-3 py-2 text-sm text-red-700 dark:text-red-300 font-medium">
              Red — Over limit
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition-colors"
        >
          See This With Your Real Team → Create Account
        </Link>
      </div>
    </div>
  );
}
