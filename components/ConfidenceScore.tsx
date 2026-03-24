"use client";

import { cn } from "@/lib/utils";

/**
 * Presentational Confidence Score card: score, progress bar, next goal, and tips.
 * Receives score from parent (dashboard fetches from user_confidence_scores).
 * Trust levels: 0–30 New Profile, 30–60 Trusted Worker, 60–90 Verified Professional, 90+ Elite Verified.
 */
export default function ConfidenceScore({
  score,
  featured = false,
}: {
  score: number;
  /** Stronger elevation when this is the primary focal card (e.g. worker dashboard). */
  featured?: boolean;
}) {
  let nextGoal = "Trusted Worker";
  let tips: string[] = [];

  if (score < 30) {
    nextGoal = "Trusted Worker";
    tips = ["Verify 1 job (+20)", "Get coworker confirmation (+10)"];
  } else if (score < 60) {
    nextGoal = "Verified Professional";
    tips = ["Add another verified job (+20)"];
  } else {
    nextGoal = "Elite Verified";
    tips = ["Request more coworker confirmations (+10)"];
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900",
        featured
          ? "shadow-lg ring-1 ring-black/5 dark:ring-white/10"
          : "shadow-sm",
      )}
    >
      <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Confidence Score
      </h2>

      <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
        {score}
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-3 rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Next level: {nextGoal}
      </p>

      <ul className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
        {tips.map((tip, i) => (
          <li key={i}>+ {tip}</li>
        ))}
      </ul>
      </div>
    </div>
  );
}
