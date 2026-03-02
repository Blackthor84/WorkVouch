"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

type TrustExplainResponse = {
  trustScore: number;
  explanation?: string;
  riskFactors?: string[];
  scoreHistory?: Array< { event: string; impact: number | null; date: string }>;
};

const RISK_TO_NEXT_STEP: Record<string, string> = {
  fraud_or_dispute: "Resolve any open disputes from your account.",
  conflicting_claims: "Review your employment history for conflicting or duplicate entries.",
  no_verification: "Add and verify employment so employers can confirm your work history.",
};

function nextStepsFromRiskFactors(riskFactors: string[]): string[] {
  const steps: string[] = [];
  for (const r of riskFactors) {
    const step = RISK_TO_NEXT_STEP[r];
    if (step) steps.push(step);
  }
  if (steps.length === 0 && riskFactors.length > 0) {
    steps.push("Review your profile and Trust Activity for recent changes.");
  }
  return steps;
}

export function TrustChangeDefense() {
  const [data, setData] = useState<TrustExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/explain", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((d: TrustExplainResponse) => {
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
  }, []);

  if (loading || !data) return null;

  const scoreHistory = data.scoreHistory ?? [];
  const recentDecrease = scoreHistory.find((e) => e.impact != null && e.impact < 0);
  if (!recentDecrease) return null;

  const nextSteps = data.riskFactors?.length
    ? nextStepsFromRiskFactors(data.riskFactors)
    : ["Review your Trust Activity for what changed.", "Add or verify employment and references to strengthen your score."];

  return (
    <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Your trust score decreased
      </h2>
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
        {recentDecrease.event ? `Reason: ${recentDecrease.event.replace(/_/g, " ")}` : "A recent change affected your trust score."}
      </p>
      {data.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{data.explanation}</p>
      )}
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Next steps:</p>
      <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1 mb-4">
        {nextSteps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/worker#trust-activity" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          View Trust Activity
        </Link>
        <Link href="/my-jobs" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Job History
        </Link>
      </div>
    </Card>
  );
}
