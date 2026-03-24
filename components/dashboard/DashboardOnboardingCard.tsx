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
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      aria-label="Get started"
    >
      <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Start building your reputation</h2>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        WorkVouch turns real overlaps and peer proof into a trust score employers respect.
      </p>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n}>
            <Link
              href={s.href}
              className="flex h-full flex-col gap-3 rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                {s.n}
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                {s.label}
                <ArrowRightIcon className="h-4 w-4 text-amber-600" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}
