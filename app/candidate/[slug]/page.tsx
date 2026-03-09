import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isEmployer } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCandidateProfile, getCandidatePreview } from "@/lib/services/profiles";
import { Button } from "@/components/ui/button";

/**
 * Candidate profile: public preview (blurred) or full employer view.
 * Pages call services only; no direct Supabase.
 * - Not logged in / not employer / no subscription → blurred preview + Login CTA
 * - Logged-in employer with active subscription → full verification report
 */
export default async function CandidatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const preview = await getCandidatePreview(slug);
  if (!preview) notFound();

  const { profile, confidenceScore: previewScore, jobCount: numJobs } = preview;
  const fullName = profile.full_name ?? "Candidate";
  const industry = profile.industry;
  const summary = profile.professional_summary;

  const user = await getCurrentUser();
  const isEmployerUser = user ? await isEmployer() : false;
  const subCheck = user ? await requireActiveSubscription(user.id) : { allowed: false };
  const hasFullAccess = Boolean(user && isEmployerUser && subCheck.allowed);

  if (hasFullAccess) {
    const candidate = await getCandidateProfile(slug);
    if (!candidate) notFound();

    const { jobs, confirmationsByJob } = candidate;
    const confidenceScore = candidate.confidenceScore;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-6">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">
              ← Dashboard
            </Link>
          </p>

          <header className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
            {industry && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">{industry}</p>
            )}
            {confidenceScore !== null && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">
                <span className="font-medium">Confidence Score:</span>{" "}
                <span className="font-semibold">{confidenceScore}</span>
              </p>
            )}
            {summary && (
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl">{summary}</p>
            )}
          </header>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Verified Work History
            </h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No verified work history yet.</p>
            ) : (
              <ul className="space-y-4">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {job.company_name}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">{job.job_title}</div>
                    {job.location && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.location}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                        Verified ✔
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {(confirmationsByJob[job.id] ?? 0)} coworker confirmation
                        {(confirmationsByJob[job.id] ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {job.is_current
                        ? "Current"
                        : `${job.start_date.slice(0, 7)} – ${job.end_date ? job.end_date.slice(0, 7) : "—"}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
            Locations are approximate and shown in aggregate to protect user privacy.
          </p>
        </div>
      </div>
    );
  }

  // Public preview: blurred work history + CTA
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6">
        <header className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
          {industry && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{industry}</p>
          )}
          {previewScore !== null && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Confidence Score:</span>{" "}
              <span className="font-semibold">{previewScore}</span>
            </p>
          )}
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verified Work History
          </h2>
          <div className="relative">
            <div
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 blur-sm select-none pointer-events-none"
              aria-hidden
            >
              <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-4" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
              <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded mb-4" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-gray-900/40 dark:bg-gray-950/50"
              aria-hidden
            >
              {numJobs > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {numJobs} verified position{numJobs !== 1 ? "s" : ""} • Locked
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
            {!user
              ? "Login to view full verification report"
              : !isEmployerUser
                ? "Employer account required to view verification report"
                : "Subscribe to view full verification report"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Employers with a WorkVouch subscription can view verified work history and coworker confirmations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!user && (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
            {user && !isEmployerUser && (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
            {(!user || isEmployerUser) && (
              <Button asChild variant={!user ? "outline" : "default"}>
                <Link href="/pricing">View plans</Link>
              </Button>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
            ← WorkVouch
          </Link>
        </p>
      </div>
    </div>
  );
}
