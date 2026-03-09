import Link from "next/link";
import { Suspense } from "react";

function SuccessContent({ sent }: { sent: number }) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Job added
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {sent > 0
          ? `Verification requests sent to ${sent} coworker${sent === 1 ? "" : "s"}. When they confirm, your job will be marked verified and your confidence score can increase.`
          : "When coworkers confirm your employment, your job will be marked verified and your confidence score can increase."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          Back to dashboard
        </Link>
        <Link
          href="/my-jobs"
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View my jobs
        </Link>
      </div>
    </div>
  );
}

export default async function JobSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  const sent = Math.max(0, parseInt(params.sent ?? "0", 10));
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <SuccessContent sent={sent} />
    </Suspense>
  );
}
