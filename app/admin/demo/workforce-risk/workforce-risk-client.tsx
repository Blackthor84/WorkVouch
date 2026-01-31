"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Mock data for demo. Not connected to real DB. */
function useMockWorkforceRisk() {
  return useMemo(() => {
    const totalEmployees = 1247;
    const verifiedCount = 892;
    const activeDisputes = 12;
    const averageRiskScore = 34;
    const highRiskCount = 89;
    const trendData = [42, 38, 39, 36, 35, 34];
    return {
      totalEmployees,
      verifiedCount,
      verifiedPercent: totalEmployees > 0 ? Math.round((verifiedCount / totalEmployees) * 100) : 0,
      activeDisputes,
      averageRiskScore,
      highRiskCount,
      trendData,
    };
  }, []);
}

export default function WorkforceRiskClient() {
  const data = useMockWorkforceRisk();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            Workforce Risk Dashboard
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Mock metrics. Behind workforce_risk_dashboard feature flag. Not public.
          </p>
        </div>
        <Button variant="secondary" href="/admin/demo">
          Back to Demo Hub
        </Button>
      </div>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 mb-8 text-amber-800 dark:text-amber-200 text-sm font-medium">
        Demo Mode — All data is simulated. No real user data.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
              Total employees
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
              {data.totalEmployees.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
              % verified
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
              {data.verifiedPercent}%
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
              {data.verifiedCount} of {data.totalEmployees}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
              Active disputes
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.activeDisputes}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
              Average risk score
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
              {data.averageRiskScore}
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
              0–100 scale
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-grey-medium dark:text-gray-400 uppercase tracking-wide">
              High risk count
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.highRiskCount}
            </p>
            <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
              Score &gt; 70
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
            Risk trend (mock)
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {data.trendData.map((value, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end"
              >
                <div
                  className="w-full bg-violet-500/80 dark:bg-violet-500/60 rounded-t min-h-[4px] transition-all"
                  style={{ height: `${Math.min(100, value)}%` }}
                  title={`Period ${i + 1}: ${value}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-grey-medium dark:text-gray-400">
            {data.trendData.map((_, i) => (
              <span key={i}>P{i + 1}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
