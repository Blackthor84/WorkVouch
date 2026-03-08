"use client";

/**
 * Presentational Confidence Score card: score, progress bar, next goal, and tips.
 * Receives score from parent (dashboard fetches from user_confidence_scores).
 * Trust levels: 0–30 New Profile, 30–60 Trusted Worker, 60–90 Verified Professional, 90+ Elite Verified.
 */
export default function ConfidenceScore({ score }: { score: number }) {
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
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 shadow dark:border-gray-800">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
        Confidence Score
      </h2>

      <div className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        {score}
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded mb-4 overflow-hidden">
        <div
          className="bg-green-500 h-3 rounded transition-all duration-500"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Next level: {nextGoal}
      </p>

      <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
        {tips.map((tip, i) => (
          <li key={i}>+ {tip}</li>
        ))}
      </ul>
    </div>
  );
}
