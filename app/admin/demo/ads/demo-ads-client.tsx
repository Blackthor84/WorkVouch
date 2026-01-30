"use client";

import { useState } from "react";
import { usePreview } from "@/lib/preview-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AdsDemoState {
  advertiserImpressions: number;
  advertiserClicks: number;
  advertiserBudget: number;
  advertiserCPC: number;
}

export default function DemoAdsClient() {
  const { preview } = usePreview();
  const demoActive = Boolean(preview?.demoActive);

  const [demoState, setDemoState] = useState<AdsDemoState>({
    advertiserImpressions: 10000,
    advertiserClicks: 250,
    advertiserBudget: 500,
    advertiserCPC: 2,
  });

  const setNum = <K extends keyof AdsDemoState>(key: K, value: number) => {
    setDemoState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!demoActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">Advertiser ROI Demo</h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6">
          Enable Elite Demo Mode to view this page. Use <code className="bg-black/10 dark:bg-white/10 px-1 rounded">?demo=elite</code> or activate from Hidden Features.
        </p>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
        </Link>
      </div>
    );
  }

  const { advertiserImpressions: impressions, advertiserClicks: clicks, advertiserBudget: spend, advertiserCPC: cpc } = demoState;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const revenue = clicks * cpc;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
  const conversionLift = 12; // fake %

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">Advertiser ROI Demo</h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">CTR = clicks / impressions · ROI = (Revenue − Spend) / Spend</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">Back to Admin</Button>
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
              value={impressions}
              onChange={(e) => setNum("advertiserImpressions", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{impressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Clicks</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={10}
              max={10000}
              step={10}
              value={clicks}
              onChange={(e) => setNum("advertiserClicks", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400">{clicks.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Spend ($)</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={spend}
              onChange={(e) => setNum("advertiserBudget", Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400">${spend}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">CTR (calculated)</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{ctr.toFixed(2)}%</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">clicks / impressions × 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">ROI (calculated)</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{roi.toFixed(1)}%</p>
            <p className="text-sm text-grey-medium dark:text-gray-400">(Revenue − Spend) / Spend × 100</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Conversion lift %</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{conversionLift}% (demo)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">Simple chart</h2>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2">
            <div
              className="flex-1 bg-violet-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (impressions / 200000) * 100)}%` }}
              title={`Impressions ${impressions}`}
            />
            <div
              className="flex-1 bg-emerald-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (clicks / 10000) * 100)}%` }}
              title={`Clicks ${clicks}`}
            />
            <div
              className="flex-1 bg-amber-500/80 rounded-t min-h-[20px]"
              style={{ height: `${Math.min(100, (spend / 5000) * 100)}%` }}
              title={`Spend $${spend}`}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-grey-medium dark:text-gray-400">
            <span>Impressions</span>
            <span>Clicks</span>
            <span>Spend</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
