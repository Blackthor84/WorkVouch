import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidateProfile } from "@/lib/services/profiles";
import { admin } from "@/lib/supabase-admin";

/**
 * Employer-facing verification view: verified jobs, coworker verification counts,
 * verification status, and timestamps. Public route; full data for employers with access.
 */
export default async function CandidateVerificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const candidate = await getCandidateProfile(slug);
  if (!candidate) notFound();

  const { profile, jobs, confirmationsByJob } = candidate;
  const fullName = profile.full_name ?? "Candidate";

  // Fetch verification timestamps per job (latest per job)
  const jobIds = jobs.map((j) => j.id);
  let verificationsByJob: Record<string, { count: number; latestAt: string | null }> = {};
  if (jobIds.length > 0) {
    const { data: rows } = await (admin as any)
      .from("job_verifications")
      .select("job_id, created_at")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });
    const list = (rows ?? []) as { job_id: string; created_at: string }[];
    for (const j of jobIds) {
      const forJob = list.filter((r) => r.job_id === j);
      verificationsByJob[j] = {
        count: forJob.length,
        latestAt: forJob[0]?.created_at ?? null,
      };
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-6">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/candidate/${slug}`} className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to profile
          </Link>
        </p>

        <header className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verification details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{fullName}</p>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Verified jobs
          </h2>
          {jobs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No verified jobs yet.</p>
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => {
                const count = confirmationsByJob[job.id] ?? 0;
                const meta = verificationsByJob[job.id];
                return (
                  <li
                    key={job.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {job.company_name}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">{job.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                        Verified
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {count} coworker confirmation{count !== 1 ? "s" : ""}
                      </span>
                      {meta?.latestAt && (
                        <span className="text-gray-500 dark:text-gray-400">
                          Latest: {new Date(meta.latestAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {job.is_current
                        ? "Current"
                        : `${job.start_date.slice(0, 7)} – ${job.end_date ? job.end_date.slice(0, 7) : "—"}`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
