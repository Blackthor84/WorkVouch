"use client";

import type { SimulationOutput } from "@/lib/simulation/types";

interface AdvancedAnalyticsProps {
  simulation?: SimulationOutput;
}

export function AdvancedAnalytics({ simulation }: AdvancedAnalyticsProps) {
  return (
    <div className="p-6 border rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/50">
      <h3 className="text-lg font-bold text-grey-dark dark:text-gray-200">
        Advanced Analytics Active
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        This feature is controlled by the feature flag system.
      </p>
      {simulation && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-grey-medium dark:text-gray-400">Rehire probability</span>
            <p className="font-semibold text-grey-dark dark:text-gray-200">{simulation.rehireProbability}%</p>
          </div>
          <div>
            <span className="text-grey-medium dark:text-gray-400">Team compatibility</span>
            <p className="font-semibold text-grey-dark dark:text-gray-200">{simulation.teamCompatibilityScore}%</p>
          </div>
          <div>
            <span className="text-grey-medium dark:text-gray-400">Workforce risk</span>
            <p className="font-semibold text-grey-dark dark:text-gray-200">{simulation.workforceRiskScore}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
