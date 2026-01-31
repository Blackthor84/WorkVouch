"use client";

import { useState } from "react";
import { usePreview } from "@/lib/preview-context";
import { runSimulation } from "@/lib/simulation/engine";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DemoAdsClient() {
  const { preview } = usePreview();
  const demoActive = Boolean(preview?.demoActive);

  const [advertiserImpressions, setAdvertiserImpressions] = useState(10000);
  const [advertiserCTR, setAdvertiserCTR] = useState(2.5);

  const result = runSimulation({
    plan: "pro",
    seats: 10,
    reportsUsed: 0,
    searchesUsed: 0,
    subscriptionActive: true,
    advertiserImpressions,
    advertiserCTR,
  });

  const clicks = result.estimatedClicks ?? 0;
  const estimatedRevenue = result.estimatedRevenue ?? 0;
  const roi = result.estimatedAdROI ?? 0;
  const ctrDisplay = advertiserImpressions > 0 ? ((clicks / advertiserImpressions) * 100).toFixed(2) : "0";

  if (!demoActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">Advertiser ROI Demo</h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6">
          Enable Elite Demo Mode to view this page. Use <code className="bg-black/10 dark:bg-white/10 px-1 rounded">?demo=elite</code> or activate from Hidden Features.
        </p>
        <Link href="/admin" onClick={() => console.log("[Demo Ads] Back to Admin clicked")}>
          <Button type="button" variant="secondary">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">Advertiser ROI Demo</h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">Powered by simulation engine — clicks, revenue, ROI from runSimulation()</p>
        </div>
        <Link href="/admin" onClick={() => console.log("[Demo Ads] Back to Admin clicked")}>
          <Button type="button" variant="secondary">Back to Admin</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Impressions</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={1000}
              max={200000}
              step={1000}
              value={advertiserImpressions}
              onChange={(e) => setAdvertiserImpressions(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{advertiserImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">CTR %</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={advertiserCTR}
              onChange={(e) => setAdvertiserCTR(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{advertiserCTR}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Revenue projection</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${estimatedRevenue.toLocaleString()}</p>
            <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">From engine</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Clicks</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{clicks.toLocaleString()}</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">impressions × CTR (engine)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Estimated revenue</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">${estimatedRevenue.toLocaleString()}</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">clicks × $4 (engine)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">ROI</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{roi}x</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">revenue / $1000 baseline (engine)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">CTR (display)</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{ctrDisplay}%</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">clicks / impressions × 100</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm font-medium">
            Revenue projection: ${estimatedRevenue.toLocaleString()} (engine)
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Simple chart</h2>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2">
            <div
              className="flex-1 bg-violet-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (advertiserImpressions / 200000) * 100)}%` }}
              title={`Impressions ${advertiserImpressions}`}
            />
            <div
              className="flex-1 bg-emerald-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (clicks / 10000) * 100)}%` }}
              title={`Clicks ${clicks}`}
            />
            <div
              className="flex-1 bg-amber-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (estimatedRevenue / 50000) * 100)}%` }}
              title={`Revenue $${estimatedRevenue}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-grey-medium dark:text-gray-400">
            <span>Impressions</span>
            <span>Clicks</span>
            <span>Revenue</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
