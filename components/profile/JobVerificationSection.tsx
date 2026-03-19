import Link from "next/link";
import Image from "next/image";
import type { JobWithCoworkers } from "@/lib/actions/getJobsWithVerifiedCoworkers";
import { CheckBadgeIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { BriefcaseIcon } from "@heroicons/react/24/outline";

function formatDateRange(
  start: string | null,
  end: string | null
): string {
  if (!start) return "";
  const startStr = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const endStr = end
    ? new Date(end).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Present";
  return `${startStr} – ${endStr}`;
}

type Props = {
  jobsWithCoworkers: JobWithCoworkers[];
};

export function JobVerificationSection({ jobsWithCoworkers }: Props) {
  if (jobsWithCoworkers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-8 text-center">
        <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Work history & verified coworkers
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add your first job to start building your network and get verified by
          coworkers.
        </p>
        <Link
          href="/my-jobs"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add a job
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Work history & verified coworkers
      </h2>
      <div className="space-y-4">
        {jobsWithCoworkers.map(({ job, coworkers }) => {
          const roleAndDates = [
            job.role?.trim() || null,
            formatDateRange(job.start_date, job.end_date) || null,
          ]
            .filter(Boolean)
            .join(" • ");
          return (
            <div
              key={job.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 overflow-hidden"
            >
              <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50/50 dark:bg-gray-800/30">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {job.company_name || "Unknown company"}
                </p>
                {roleAndDates && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {roleAndDates}
                  </p>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CheckBadgeIcon className="h-4 w-4 text-green-600 dark:text-green-500 shrink-0" />
                  Verified coworkers
                </p>
                {coworkers.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {coworkers.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 min-w-0"
                      >
                        {c.profile_photo_url ? (
                          <Image
                            src={c.profile_photo_url}
                            alt=""
                            width={28}
                            height={28}
                            className="rounded-full h-7 w-7 object-cover shrink-0"
                          />
                        ) : (
                          <UserCircleIcon className="h-7 w-7 text-gray-400 dark:text-gray-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {c.full_name || "Coworker"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No verified coworkers yet
                  </p>
                )}
                <Link
                  href="/coworker-matches"
                  className="mt-3 inline-flex text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Request verification
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        <Link href="/coworker-matches" className="text-blue-600 dark:text-blue-400 hover:underline">
          Manage coworker matches
        </Link>
        {" · "}
        <Link href="/my-jobs" className="text-blue-600 dark:text-blue-400 hover:underline">
          Edit jobs
        </Link>
      </p>
    </div>
  );
}
