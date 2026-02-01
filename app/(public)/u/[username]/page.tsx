import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicPassportBySlug } from "@/lib/actions/public-passport";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Career Passport",
  description: "Verified Career Passport on WorkVouch",
};

export default async function PublicCareerPassportPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getPublicPassportBySlug(username);
  if (!data) notFound();

  const { profile, jobs, profileStrength, referenceCount, referenceResponseRate, credentialCount, disputeTotal, disputeResolved, industryBadge } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        {/* Header */}
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
                  Verified Career Passport
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
                <span className="text-sm text-slate-500 dark:text-slate-400">Profile Strength</span>
              </div>
            </div>
          </div>
        </header>

        {/* Verified Employment Timeline */}
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

        {/* Reference Strength */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Reference Strength
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {referenceCount} reference{referenceCount !== 1 ? "s" : ""} on file
            {referenceResponseRate != null ? ` · ${referenceResponseRate}% response rate` : ""}
          </p>
        </section>

        {/* Credentials */}
        {credentialCount > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Credentials &amp; Certifications
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {credentialCount} verified credential{credentialCount !== 1 ? "s" : ""} on file
            </p>
          </section>
        )}

        {/* Data Integrity & Dispute Transparency */}
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
            <Link href="/directory">Browse directory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
