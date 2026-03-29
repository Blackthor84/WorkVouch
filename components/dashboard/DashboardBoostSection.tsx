import Link from "next/link";
import { cn } from "@/lib/utils";

export function DashboardBoostSection() {
  return (
    <section
      className={cn(
        "rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 p-6 shadow-sm",
        "dark:border-blue-900/40 dark:from-blue-950/40 dark:via-slate-900/60 dark:to-indigo-950/30"
      )}
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Boost your trust score</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
        Add verified work and invite people who know your track record—the fastest way to stand out.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/jobs/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
        >
          Add job
        </Link>
        <Link
          href="/coworker-matches"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Invite coworker
        </Link>
      </div>
    </section>
  );
}
