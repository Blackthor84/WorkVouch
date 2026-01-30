"use client";

import { useState } from "react";
import { usePreview, defaultEliteState, type PreviewState } from "@/lib/preview-context";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SimulationClient() {
  const { preview, setPreview } = usePreview();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const p = preview ?? ({} as PreviewState);
  const demoActive = Boolean(p.demoActive);
  const seatsUsed = p.seatsUsed ?? 3;
  const seatsLimit = p.seatsLimit ?? 10;
  const reportsUsed = p.reportsUsed ?? 5;
  const reportLimit = p.reportLimit ?? 20;
  const searchesUsed = p.searchesUsed ?? 12;
  const searchLimit = p.searchLimit ?? 25;
  const seatsOverflow = seatsLimit > 0 && seatsUsed >= seatsLimit;
  const reportsOverflow = reportLimit > 0 && reportsUsed >= reportLimit;
  const searchesOverflow = searchLimit > 0 && searchesUsed >= searchLimit;
  const anyOverflow = seatsOverflow || reportsOverflow || searchesOverflow;

  const update = (partial: Partial<PreviewState>) => {
    setPreview((prev) => {
      const base = prev ?? (defaultEliteState() as PreviewState);
      return { ...base, ...partial };
    });
  };

  const activateElite = (overrides: Partial<PreviewState>) => {
    const base = preview?.demoActive ? preview : (defaultEliteState() as PreviewState);
    setPreview({ ...base, demoActive: true, ...overrides });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Elite Simulation Control</h1>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-auto py-3"
          onClick={() =>
            setPreview({
              role: "employer",
              subscription: "starter",
              featureFlags: [],
              fakeUserName: "Test Employer",
              fakeCompanyName: "Demo Company",
            })
          }
        >
          Starter Employer View
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3"
          onClick={() =>
            setPreview({
              role: "employer",
              subscription: "pro",
              featureFlags: ["advanced_analytics", "ads_system", "rehire_probability_index"],
              fakeUserName: "Elite Employer",
              fakeCompanyName: "Enterprise Security Corp",
              simulateAds: true,
            })
          }
        >
          Pro Enterprise View
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Elite Demo — Plan limit overflow simulation</h2>
          <p className="text-sm text-grey-medium dark:text-gray-400">Display only. Used ≥ limit locks UI visually; no backend enforcement.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Seats Used / Limit</label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={0}
                max={20}
                value={seatsUsed}
                onChange={(e) => update({ seatsUsed: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-grey-medium dark:text-gray-400 w-24">{seatsUsed} / {seatsLimit}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={seatsLimit}
              onChange={(e) => update({ seatsLimit: Number(e.target.value) })}
              className="mt-2 w-full opacity-70"
            />
            <span className="text-xs text-grey-medium dark:text-gray-400">Limit</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Reports Used / Limit</label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={0}
                max={50}
                value={reportsUsed}
                onChange={(e) => update({ reportsUsed: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-grey-medium dark:text-gray-400 w-24">{reportsUsed} / {reportLimit}</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={reportLimit}
              onChange={(e) => update({ reportLimit: Number(e.target.value) })}
              className="mt-2 w-full opacity-70"
            />
            <span className="text-xs text-grey-medium dark:text-gray-400">Limit</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">Searches Used / Limit</label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min={0}
                max={50}
                value={searchesUsed}
                onChange={(e) => update({ searchesUsed: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-grey-medium dark:text-gray-400 w-24">{searchesUsed} / {searchLimit}</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={searchLimit}
              onChange={(e) => update({ searchLimit: Number(e.target.value) })}
              className="mt-2 w-full opacity-70"
            />
            <span className="text-xs text-grey-medium dark:text-gray-400">Limit</span>
          </div>
          {anyOverflow && (
            <Button variant="destructive" onClick={() => setShowUpgradeModal(true)}>
              Simulate: Upgrade Required
            </Button>
          )}
        </CardContent>
      </Card>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white dark:bg-[#1A1F2B] rounded-lg p-6 max-w-sm shadow-xl border border-grey-background dark:border-[#374151]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">Upgrade Required</h3>
            <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">Demo: used ≥ limit. Display only — no API enforcement.</p>
            <Button onClick={() => setShowUpgradeModal(false)}>Close</Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Quick Elite presets</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => activateElite({ simulateExpired: false, subscriptionStatus: "active" })}>
            Activate Elite Demo
          </Button>
          <Link href="/admin/demo/revenue">
            <Button variant="outline" size="sm">Revenue Simulator</Button>
          </Link>
          <Link href="/admin/demo/ads">
            <Button variant="outline" size="sm">Ads ROI Simulator</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
