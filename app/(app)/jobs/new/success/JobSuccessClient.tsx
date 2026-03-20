"use client";

import { useState } from "react";
import Link from "next/link";
import { PostJobCoworkerInviteModal } from "@/components/invites/PostJobCoworkerInviteModal";

function SuccessBody({ sent, returnTo }: { sent: number; returnTo: "onboarding" | null }) {
  return (
    <>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 dark:border-emerald-800 px-4 py-3 mb-6 text-left">
        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Nice — you&apos;re building your profile</p>
        <p className="text-xs text-emerald-800/90 dark:text-emerald-200/80 mt-1">
          Your job is saved. Next, find coworkers or continue guided setup.
        </p>
      </div>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job added</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {sent > 0
          ? `Verification requests sent to ${sent} coworker${sent === 1 ? "" : "s"}. When they confirm, your job will be marked verified and your confidence score can increase.`
          : "When coworkers confirm your employment, your job will be marked verified and your confidence score can increase."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={returnTo === "onboarding" ? "/onboarding?celebrate=job" : "/dashboard"}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          {returnTo === "onboarding" ? "Continue setup" : "Back to dashboard"}
        </Link>
        <Link
          href="/my-jobs"
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          View my jobs
        </Link>
      </div>
    </>
  );
}

export function JobSuccessClient({
  sent,
  company,
  jobId,
  returnTo = null,
}: {
  sent: number;
  company: string;
  jobId: string;
  returnTo?: "onboarding" | null;
}) {
  const [modalOpen, setModalOpen] = useState(true);
  const showModal = Boolean(company.trim());

  return (
    <div className="max-w-xl mx-auto text-center py-12 px-4">
      <SuccessBody sent={sent} returnTo={returnTo} />
      {showModal && (
        <PostJobCoworkerInviteModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          companyName={company}
          jobId={jobId || null}
        />
      )}
    </div>
  );
}
