"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrustScoreCardClient } from "@/components/trust/TrustScoreCardClient";
import { TrustTrajectoryCard } from "@/components/trust/TrustTrajectoryCard";
import { TrustForecastCard } from "@/components/trust/TrustForecastCard";
import { VerificationCoverageCard } from "@/components/trust/VerificationCoverageCard";
import { TrustRadarChart } from "@/components/trust/TrustRadarChart";
import { IndustryBenchmarkCard } from "@/components/trust/IndustryBenchmarkCard";
import { TrustTimeline } from "@/components/trust/TrustTimeline";
import { TrustNetworkPanel } from "@/components/trust/TrustNetworkPanel";
import { RecentReferencesPanel } from "@/components/employee/RecentReferencesPanel";
import { CredentialCard } from "@/components/workvouch/CredentialCard";
import { EmploymentHistoryPanel } from "@/components/employee/EmploymentHistoryPanel";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";
import { VerificationInbox } from "@/components/verification/VerificationInbox";
import { Button } from "@/components/ui/button";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

/**
 * Employee Dashboard — decision panels with live API data.
 * Top: TrustScoreCard, TrustTrajectoryCard, TrustForecastCard, VerificationCoverageCard
 * Middle: TrustRadarChart, IndustryBenchmarkCard, TrustTimeline
 * Bottom: TrustNetworkPanel, CredentialCard, EmploymentHistoryPanel
 */
export default function WorkerDashboard() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Trust Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your professional identity at a glance. All panels use live data from APIs.
          </p>
        </header>

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TrustScoreCardClient />
          <TrustTrajectoryCard />
          <TrustForecastCard />
          <VerificationCoverageCard />
        </div>

        {/* Middle row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrustRadarChart />
          <IndustryBenchmarkCard />
          <TrustTimeline />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrustNetworkPanel />
          <CredentialCard />
          <EmploymentHistoryPanel />
        </div>

        {/* Verification requests: inbox + request CTA */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Verification requests
            </h2>
            <Button
              variant="secondary"
              onClick={() => setRequestModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              Request verification
            </Button>
          </div>
          <VerificationInbox />
        </section>
      </div>

      <VerificationRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        onSuccess={() => setRequestModalOpen(false)}
      />
    </div>
  );
}
