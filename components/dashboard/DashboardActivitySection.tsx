import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/actions/dashboard/getDashboardHome";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export function DashboardActivitySection({ activities }: { activities: DashboardActivityItem[] }) {
  return (
    <section aria-label="Recent activity" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent activity</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Matches, reviews, and verification updates</p>
        </div>
        <Link
          href="/notifications"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          All notifications →
        </Link>
      </div>
      <ActivityFeed items={activities} />
    </section>
  );
}
