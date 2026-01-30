"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

type Tier = "emp_lite" | "emp_pro" | "emp_enterprise";

type InsightsResponse = {
  tier: Tier;
  reference_consistency: {
    alignmentScore?: number;
    label: string;
    referenceCount: number;
    sufficientData: boolean;
  } | null;
  stability_index: {
    level: string;
    summary: string;
    sufficientData: boolean;
  } | null;
  environment_fit_indicator: {
    bestFit: { environment: string; confidencePct?: number; confidenceLabel?: string };
    secondaryFit?: { environment: string; confidencePct?: number; confidenceLabel?: string } | null;
    breakdown?: { category: string; score: number }[];
    sufficientData: boolean;
  } | null;
};

export function WorkVouchInsightsSection({ candidateId }: { candidateId: string }) {
  const { enabled: refEnabled } = useFeatureFlag("reference_consistency");
  const { enabled: stabEnabled } = useFeatureFlag("stability_index");
  const { enabled: envEnabled } = useFeatureFlag("environment_fit_indicator");
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const anyEnabled = refEnabled || stabEnabled || envEnabled;

  useEffect(() => {
    if (!anyEnabled || !candidateId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/employer/insights?candidateId=${encodeURIComponent(candidateId)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anyEnabled, candidateId]);

  if (!anyEnabled) return null;
  if (loading) {
    return (
      <Card className="p-6 border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          WorkVouch Insights
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading insights…
        </p>
      </Card>
    );
  }

  const tier = data?.tier ?? "emp_lite";
  const isEnterprise = tier === "emp_enterprise";
  const showUpsell = !isEnterprise && (refEnabled || stabEnabled || envEnabled);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
        WorkVouch Insights
      </h2>

      {showUpsell && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Unlock Advanced WorkVouch Insights
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Includes confidence scoring, full environment modeling, and deep reference alignment analysis.
          </p>
          <Link href="/employer/upgrade">
            <Button>Upgrade to Enterprise</Button>
          </Link>
        </Card>
      )}

      {refEnabled && (
        <Card className="p-6 border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Reference Alignment Score
            </h3>
            <span title="Measures alignment between peer feedback across structured categories. Higher consistency indicates stable performance patterns.">
              <InformationCircleIcon className="h-5 w-5 text-slate-400 shrink-0" />
            </span>
          </div>
          {data?.reference_consistency == null ? (
            <UnavailableCard />
          ) : !data.reference_consistency.sufficientData ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Insufficient data for high-confidence alignment score.
            </p>
          ) : (
            <>
              {"alignmentScore" in data.reference_consistency &&
                data.reference_consistency.alignmentScore != null &&
                isEnterprise && (
                  <div className="flex items-center gap-4 mb-2">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center relative"
                      style={{
                        background: `conic-gradient(#3b82f6 0% ${data.reference_consistency.alignmentScore}%, #e2e8f0 ${data.reference_consistency.alignmentScore}% 100%)`,
                      }}
                    >
                      <span className="absolute inset-[3px] rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-lg font-bold text-slate-800 dark:text-slate-200">
                        {data.reference_consistency.alignmentScore}
                      </span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {data.reference_consistency.label}
                    </span>
                  </div>
                )}
              {(!isEnterprise || !("alignmentScore" in data.reference_consistency)) && (
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {data.reference_consistency.label}
                </p>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Peer feedback alignment across {data.reference_consistency.referenceCount} verified reference
                {data.reference_consistency.referenceCount !== 1 ? "s" : ""}.
              </p>
            </>
          )}
        </Card>
      )}

      {stabEnabled && (
        <Card className="p-6 border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Workforce Stability
            </h3>
            <span title="Based on tenure length, job frequency, and peer-confirmed employment.">
              <InformationCircleIcon className="h-5 w-5 text-slate-400 shrink-0" />
            </span>
          </div>
          {data?.stability_index == null ? (
            <UnavailableCard />
          ) : (
            <>
              <div className="flex gap-1 mb-2">
                {(["Low", "Moderate", "High"] as const).map((level) => (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded ${
                      data.stability_index!.level.startsWith(level)
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-slate-200 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {data.stability_index.level}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {data.stability_index.summary}
              </p>
            </>
          )}
        </Card>
      )}

      {envEnabled && (
        <Card className="p-6 border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2 mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Environment Fit Insights
            </h3>
            <span title="Based on structured peer feedback and historical performance patterns. This does not assess personality traits.">
              <InformationCircleIcon className="h-5 w-5 text-slate-400 shrink-0" />
            </span>
          </div>
          {data?.environment_fit_indicator == null ? (
            <UnavailableCard />
          ) : !data.environment_fit_indicator.sufficientData ? (
            <UnavailableCard />
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Best Fit Environment</p>
              <div className="inline-block px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-2">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {data.environment_fit_indicator.bestFit.environment}
                </span>
                {data.environment_fit_indicator.bestFit.confidencePct != null && isEnterprise && (
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    ({data.environment_fit_indicator.bestFit.confidencePct}%{" "}
                    {data.environment_fit_indicator.bestFit.confidenceLabel ?? "confidence"})
                  </span>
                )}
              </div>
              {data.environment_fit_indicator.secondaryFit && (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 mt-3">Secondary Fit</p>
                  <div className="inline-block px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                    {data.environment_fit_indicator.secondaryFit.environment}
                    {data.environment_fit_indicator.secondaryFit.confidencePct != null &&
                      isEnterprise && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                          ({data.environment_fit_indicator.secondaryFit.confidencePct}%{" "}
                          {data.environment_fit_indicator.secondaryFit.confidenceLabel ?? "confidence"})
                        </span>
                      )}
                  </div>
                </>
              )}
              {data.environment_fit_indicator.breakdown &&
                data.environment_fit_indicator.breakdown.length > 0 &&
                isEnterprise && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {showBreakdown ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                      View Breakdown
                    </button>
                    {showBreakdown && (
                      <div className="mt-3 space-y-2">
                        {data.environment_fit_indicator.breakdown.map((b) => (
                          <div key={b.category} className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400 w-40 shrink-0">
                              {b.category}
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded overflow-hidden">
                              <div
                                className="h-full bg-slate-500 dark:bg-slate-400 rounded"
                                style={{ width: `${Math.min(100, b.score)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-8">{b.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function UnavailableCard() {
  return (
    <div className="py-4 text-center">
      <p className="font-medium text-slate-600 dark:text-slate-400">
        WorkVouch Insight Unavailable
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
        We are collecting sufficient peer data to generate this insight.
      </p>
    </div>
  );
}
