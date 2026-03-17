import { getCurrentUserProfile } from "@/lib/auth";
import { getUser } from "@/lib/auth/getUser";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ConfidenceScore } from "@/components/confidence-score";
import { VerifiedJobs } from "@/components/verified-jobs";
import { PendingVerifications } from "@/components/pending-verifications";
import { BoostTrustScoreCard } from "@/components/workvouch/BoostTrustScoreCard";
import { PlusIcon, DocumentArrowUpIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function UserDashboardPage() {
  const user = await getUser();
  if (!user) return null;
  const profile = await getCurrentUserProfile();
  const profileId = profile?.id ?? user.id;

  return (
    <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
      {/* Trust Overview header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Trust Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          WorkVouch is a trust score for your work history. Add jobs and get coworkers to verify.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add Verified Job
        </Link>
        <Link
          href="/upload-resume"
          className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <DocumentArrowUpIcon className="h-5 w-5" />
          Upload Resume
        </Link>
        <Link
          href="/coworker-matches"
          className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <EnvelopeIcon className="h-5 w-5" />
          Request Verification
        </Link>
      </div>

      {/* Boost Trust Score — invite coworkers */}
      <div className="mb-8">
        <BoostTrustScoreCard />
      </div>

      {/* Confidence Score */}
      <div className="mb-8">
        <ConfidenceScore userId={user.id} />
      </div>

      {/* Verified Work History + Pending Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VerifiedJobs userId={user.id} />
        </div>
        <div>
          <PendingVerifications profileId={profileId} />
        </div>
      </div>
    </main>
  );
}
