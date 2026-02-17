"use client";

import { Card } from "@/components/ui/card";
import { EyeIcon } from "@heroicons/react/24/outline";

/**
 * Placeholder for candidate view history. When backend tracking exists,
 * replace with real data (candidate id/name, viewed at timestamp).
 */
export function CandidateViewHistoryCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <EyeIcon className="h-5 w-5 text-grey-medium dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
          Candidate view history
        </h3>
      </div>
      <p className="text-sm text-grey-medium dark:text-gray-400">
        View history is not yet tracked. When available, you will see candidates you have viewed here with timestamps.
      </p>
      <p className="mt-2 text-xs text-grey-medium dark:text-gray-500">
        No action needed. This section will update automatically when tracking is enabled.
      </p>
    </Card>
  );
}
