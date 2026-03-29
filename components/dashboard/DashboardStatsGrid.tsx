import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function DashboardStatsGrid({
  verifiedReferences,
  coworkerMatches,
  completedJobs,
  pendingRequests,
}: {
  verifiedReferences: number;
  coworkerMatches: number;
  completedJobs: number;
  pendingRequests: number;
}) {
  return (
    <section aria-label="Statistics" className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        At a glance
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Verified references" value={verifiedReferences} />
        <StatCard label="Coworker matches" value={coworkerMatches} />
        <StatCard label="Completed jobs" value={completedJobs} />
        <StatCard label="Pending requests" value={pendingRequests} />
      </div>
    </section>
  );
}
