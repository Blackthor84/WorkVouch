import { notFound } from "next/navigation";
import Link from "next/link";
import { getPassportPageData } from "@/lib/actions/public-passport";
import { Button } from "@/components/ui/button";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Work Passport",
  description: "Verified Work Passport on WorkVouch",
};

export default async function PassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getPassportPageData(username);

  if (result.kind === "not_found") notFound();

  if (result.kind === "private") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="mx-auto max-w-md w-full">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <LockClosedIcon className="h-7 w-7 text-slate-600 dark:text-slate-400" aria-hidden />
            </div>
            <h1 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">
              Passport Protected
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              This professional has not made their Work Passport searchable.
            </p>
            <div className="mt-8">
              <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                <Link href="/login">Invite to Share Passport</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
              Work Passport is a privacy-first verification platform. Professionals control who can see their verified employment and credentials.
            </p>
          </div>
          <div className="mt-6 text-center">
            <Button asChild variant="secondary" size="sm">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const data = result.data;
  const { profile, jobs, profileStrength, referenceCount, referenceResponseRate, credentialCount, disputeTotal, disputeResolved, industryBadge } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {profile.full_name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {profile.full_name}
              </h1>
              {profile.city || profile.state ? (
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Verified Work Passport
                </span>
                {industryBadge ? (
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {industryBadge.replace(/_/g, " ")}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {Math.round(profileStrength)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Trust score</span>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Verified Employment Timeline
          </h2>
          <ul className="mt-4 space-y-4">
            {jobs.length === 0 ? (
              <li className="text-sm text-slate-500 dark:text-slate-400">No verified positions yet.</li>
            ) : (
              jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800"
                >
                  <span className="font-medium text-slate-900 dark:text-white">{job.job_title}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{job.company_name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {new Date(job.start_date).toLocaleDateString()} –{" "}
                    {job.end_date ? new Date(job.end_date).toLocaleDateString() : "Present"}
                  </span>
                  {job.verification_status === "verified" && (
                    <span className="mt-1 inline-flex w-fit items-center rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Verified
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Coworker Verification
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {referenceCount} reference{referenceCount !== 1 ? "s" : ""} on file
            {referenceResponseRate != null ? ` · ${referenceResponseRate}% response rate` : ""}
          </p>
        </section>

        {credentialCount > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Credential Badges
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {credentialCount} verified credential{credentialCount !== 1 ? "s" : ""} on file
            </p>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Data Integrity &amp; Pending Clarifications
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {disputeTotal === 0
              ? "No pending clarifications."
              : `${disputeResolved} of ${disputeTotal} clarification${disputeTotal !== 1 ? "s" : ""} resolved.`}
          </p>
        </section>

        <div className="mt-10 text-center">
          <Button asChild variant="secondary">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
