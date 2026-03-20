import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function DashboardOnboardingCard() {
  const steps = [
    { n: 1, label: "Add job", href: "/jobs/new" },
    { n: 2, label: "Find coworkers", href: "/coworker-matches" },
    { n: 3, label: "Get verified", href: "/references/request" },
  ];

  return (
    <section
      className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-md dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/50"
      aria-label="Get started"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Start building your reputation</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
        WorkVouch turns real overlaps and peer proof into a trust score employers respect.
      </p>
      <ol className="mt-6 grid sm:grid-cols-3 gap-4">
        {steps.map((s) => (
          <li key={s.n}>
            <Link
              href={s.href}
              className="flex h-full flex-col rounded-xl border border-amber-200/80 bg-white/80 p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-300 dark:bg-slate-900/40 dark:border-amber-800/60 dark:hover:border-amber-600"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                {s.n}
              </span>
              <span className="mt-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                {s.label}
                <ArrowRightIcon className="h-4 w-4 text-amber-600" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
