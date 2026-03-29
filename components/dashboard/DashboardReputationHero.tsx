import { cn } from "@/lib/utils";

export function DashboardReputationHero({
  trustScore,
  verificationsThisMonth,
}: {
  trustScore: number;
  verificationsThisMonth: number;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(trustScore)));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm",
        "dark:border-slate-800 dark:bg-slate-900/60"
      )}
    >
      <div className="flex flex-col items-stretch gap-8 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            Your Reputation
          </h1>
          {verificationsThisMonth > 0 ? (
            <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              +{verificationsThisMonth} verification{verificationsThisMonth === 1 ? "" : "s"} this month
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Every verified reference strengthens how employers see you.
            </p>
          )}
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="relative h-40 w-40 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r={r}
                className="fill-none stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                className="fill-none stroke-blue-600 dark:stroke-blue-500"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`}
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {pct}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Trust score
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
