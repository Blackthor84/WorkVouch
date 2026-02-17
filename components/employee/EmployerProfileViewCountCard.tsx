"use client";

import { Card } from "@/components/ui/card";
import { EyeIcon } from "@heroicons/react/24/outline";

/**
 * Employer profile view count. Placeholder until tracking is implemented.
 * When backend exists, fetch and display count (e.g. "Viewed by N employers in the last 30 days").
 */
export function EmployerProfileViewCountCard() {
  return (
    <Card className="p-6 rounded-[20px] border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200 mb-2 flex items-center gap-2">
        <EyeIcon className="h-5 w-5 text-slate-500" />
        Employer profile views
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Profile view count is not yet tracked. When available, you’ll see how many employers have viewed your profile here.
      </p>
    </Card>
  );
}
