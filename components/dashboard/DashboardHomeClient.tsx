"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardActions from "@/components/DashboardActions";
import { ShareProfileCard } from "@/components/dashboard/ShareProfileCard";
import { VerificationInbox } from "@/components/verification/VerificationInbox";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";

/**
 * Client interactivity for the canonical employee dashboard.
 * Handles verification modal, quick actions, and share profile.
 */
export function DashboardHomeClient({ publicSlug }: { publicSlug: string | null }) {
  const searchParams = useSearchParams();
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  useEffect(() => {
    const open = () => setRequestModalOpen(true);
    window.addEventListener("workvouch:open-verification-request", open);
    return () => window.removeEventListener("workvouch:open-verification-request", open);
  }, []);

  useEffect(() => {
    if (searchParams.get("openVerification") === "1") {
      setRequestModalOpen(true);
    }
  }, [searchParams]);

  return (
    <>
      <DashboardActions onRequestVerification={() => setRequestModalOpen(true)} />

      <ShareProfileCard publicSlug={publicSlug} />

      <section aria-label="Verification requests" className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Verification requests</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Incoming and outgoing coworker verification requests
          </p>
        </div>
        <VerificationInbox />
      </section>

      <VerificationRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        onSuccess={() => setRequestModalOpen(false)}
      />
    </>
  );
}
