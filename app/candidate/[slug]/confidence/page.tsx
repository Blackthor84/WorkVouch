import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidatePreview } from "@/lib/services/profiles";
import { getConfidenceScoreByUserId } from "@/lib/db/queries/getConfidenceScoreByUserId";
import { getVerifiedJobCountByUserId } from "@/lib/db/queries/getVerifiedJobCountByUserId";
import { admin } from "@/lib/supabase-admin";

/**
 * Public confidence score breakdown: overall score, verification count,
 * verified jobs, and recency. Public route.
 */
export default async function CandidateConfidencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preview = await getCandidatePreview(slug);
  if (!preview) notFound();

  const { profile, confidenceScore: previewScore, jobCount: numJobs } = preview;
  const fullName = profile.full_name ?? "Candidate";
  const profileId = profile.id;

  const [confidenceScore, verifiedJobCount] = await Promise.all([
    getConfidenceScoreByUserId(profileId),
    getVerifiedJobCountByUserId(profileId),
  ]);

  let referenceCount = 0;
  let recentVerificationCount = 0;
  try {
    const { count: refCount } = await (admin as any)
      .from("user_references")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", profileId);
    referenceCount = refCount ?? 0;

    const { data: userJobs } = await (admin as any)
      .from("jobs")
      .select("id")
      .eq("user_id", profileId);
    const jobIds = (userJobs ?? []).map((j: { id: string }) => j.id);
    if (jobIds.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const iso = thirtyDaysAgo.toISOString();
      const { count: recentCount } = await (admin as any)
        .from("job_verifications")
        .select("id", { count: "exact", head: true })
        .in("job_id", jobIds)
        .gte("created_at", iso);
      recentVerificationCount = recentCount ?? 0;
    }
  } catch {
    // optional
  }

  const score = confidenceScore ?? previewScore ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117]">
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-6">
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <Link href={`/candidate/${slug}`} className="text-blue-600 hover:underline dark:text-blue-400">
            ← Back to profile
          </Link>
        </p>

        <header className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Confidence score
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{fullName}</p>
        </header>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 space-y-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Overall confidence score
            </h2>
            <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-white">
              {score}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Score factors
            </h2>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>Coworker verifications: {referenceCount}</li>
              <li>Verified jobs: {verifiedJobCount}</li>
              <li>Recent verifications: {recentVerificationCount}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
