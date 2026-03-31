"use client";

import { useEffect, useState } from "react";

const BAD_HIRE_COST_KEY = "badHireCost";
const BAD_HIRE_SALARY_KEY = "badHireCalculatorSalary";

/**
 * One-time banner after /employers calculator → signup: shows estimated bad-hire cost,
 * clears localStorage, optionally persists a minimal row to hiring_calculations.
 */
export function BadHireCostFromCalculatorBanner() {
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BAD_HIRE_COST_KEY);
      const salaryStored = localStorage.getItem(BAD_HIRE_SALARY_KEY);

      if (!stored) return;

      const n = Number(stored);
      if (!Number.isFinite(n) || n <= 0) {
        localStorage.removeItem(BAD_HIRE_COST_KEY);
        localStorage.removeItem(BAD_HIRE_SALARY_KEY);
        return;
      }

      setCost(n);
      localStorage.removeItem(BAD_HIRE_COST_KEY);
      localStorage.removeItem(BAD_HIRE_SALARY_KEY);

      const salaryParsed = salaryStored != null ? Number(salaryStored) : NaN;
      const salary =
        Number.isFinite(salaryParsed) && salaryParsed > 0
          ? Math.round(salaryParsed)
          : Math.round(n / 0.25);

      void fetch("/api/hiring-calculations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary,
          training_weeks: 0,
          replacement_weeks: 0,
        }),
      }).catch(() => {
        /* optional persistence; ignore */
      });
    } catch {
      /* ignore */
    }
  }, []);

  if (cost == null) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-lg mb-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">Based on your estimate:</p>

      <p className="text-xl font-bold text-red-600 dark:text-red-400">
        You could lose ${cost.toLocaleString()} from a bad hire
      </p>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Let&apos;s reduce that risk with verified coworkers.
      </p>
    </div>
  );
}
