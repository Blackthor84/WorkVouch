import Link from "next/link";

export function OnboardingIncompleteBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-blue-950 dark:text-blue-100">Keep building your trust profile</p>
          <p className="text-sm text-blue-900/85 dark:text-blue-200/90">
            Your score is live — add a job, confirm matches, and get a coworker verification so it reflects real reputation.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:scale-[1.02] hover:bg-blue-700"
        >
          Finish your first vouch →
        </Link>
      </div>
    </div>
  );
}
