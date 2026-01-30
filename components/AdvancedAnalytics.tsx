"use client";

export function AdvancedAnalytics() {
  return (
    <div className="p-6 border rounded-xl bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/50">
      <h3 className="text-lg font-bold text-grey-dark dark:text-gray-200">
        Advanced Analytics Active
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        This feature is controlled by the feature flag system.
      </p>
    </div>
  );
}
