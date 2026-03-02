"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

type HiringConfidencePayload = {
  level: "high" | "medium" | "low";
  positives: string[];
  cautions: string[];
};

const SUBTEXT =
  "Based on verification coverage, peer consistency, and dispute history.";

/**
 * Section 3 — Hiring Confidence (employer lens for employees).
 * Reuses employer confidence logic; only shows when data exists.
 */
export function EmployeeHiringConfidencePanel() {
  const [data, setData] = useState<HiringConfidencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/hiring-confidence", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d: HiringConfidencePayload) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Hiring Confidence
        </h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const levelLabel =
    data.level === "high" ? "High" : data.level === "medium" ? "Medium" : "Low";

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Hiring Confidence
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{SUBTEXT}</p>
      <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        {levelLabel}
      </p>
    </Card>
  );
}
