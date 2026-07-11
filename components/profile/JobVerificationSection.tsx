import Link from "next/link";
import Image from "next/image";
import { Briefcase, BadgeCheck, UserCircle } from "lucide-react";
import type { JobWithCoworkers } from "@/lib/actions/getJobsWithVerifiedCoworkers";
import { WvCard, WvButton } from "@/components/wv";

function formatDateRange(start: string | null, end: string | null): string {
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
      <WvCard glow className="text-center">
        <Briefcase className="mx-auto h-12 w-12 text-wv-muted" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold text-wv-foreground">
          Work history & verified coworkers
        </h2>
        <p className="mt-2 text-sm text-wv-muted">
          Add your first job to start building your network and get verified by coworkers.
        </p>
        <WvButton href="/my-jobs" className="mt-4">
          Add a job
        </WvButton>
      </WvCard>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-wv-foreground">
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
            <WvCard key={job.id} padding="none" className="overflow-hidden">
              <div className="border-b border-wv-border px-4 py-3 bg-wv-bg/50">
                <p className="font-semibold text-wv-foreground">
                  {job.company_name || "Unknown company"}
                </p>
                {roleAndDates && (
                  <p className="text-sm text-wv-muted mt-0.5">{roleAndDates}</p>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-medium text-wv-foreground mb-2">
                  <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden />
                  Verified coworkers
                </p>
                {coworkers.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {coworkers.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg border border-wv-border bg-wv-bg/50 px-3 py-2 min-w-0"
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
                          <UserCircle className="h-7 w-7 text-wv-muted shrink-0" aria-hidden />
                        )}
                        <span className="text-sm font-medium text-wv-foreground truncate">
                          {c.full_name || "Coworker"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-wv-muted">No verified coworkers yet</p>
                )}
                <Link
                  href="/coworker-matches"
                  className="mt-3 inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  + Request verification
                </Link>
              </div>
            </WvCard>
          );
        })}
      </div>
      <p className="text-sm text-wv-muted">
        <Link href="/coworker-matches" className="text-blue-400 hover:text-blue-300">
          Manage coworker matches
        </Link>
        {" · "}
        <Link href="/my-jobs" className="text-blue-400 hover:text-blue-300">
          Edit jobs
        </Link>
      </p>
    </div>
  );
}
