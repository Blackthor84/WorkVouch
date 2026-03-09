"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const MAX_SCORE = 100;

function getScoreColor(score: number) {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-blue-500";
  return "bg-green-500";
}

function getLevelLabel(score: number) {
  if (score < 40) return "Getting started";
  if (score < 60) return "Building trust";
  if (score < 80) return "Trusted worker";
  return "Verified professional";
}

export function ConfidenceScore({ userId }: { userId: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/score")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data != null) {
          const c = typeof data.confidenceScore === "number" ? data.confidenceScore : 0;
          setScore(Math.max(0, Math.min(MAX_SCORE, c)));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confidence Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const value = score ?? 0;
  const level = getLevelLabel(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confidence Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
          <span className="text-gray-500">/ {MAX_SCORE}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getScoreColor(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Next level: <strong>{level}</strong>
        </p>
      </CardContent>
    </Card>
  );
}
