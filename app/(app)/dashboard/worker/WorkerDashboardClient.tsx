"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrustScoreCardClient } from "@/components/trust/TrustScoreCardClient";
import { TrustForecastCard } from "@/components/trust/TrustForecastCard";
import { VerificationCoverageCard } from "@/components/trust/VerificationCoverageCard";
import { TrustRadarChart } from "@/components/trust/TrustRadarChart";
import { IndustryBenchmarkCard } from "@/components/trust/IndustryBenchmarkCard";
import { TrustTimeline } from "@/components/trust/TrustTimeline";
import { TrustNetworkPanel } from "@/components/trust/TrustNetworkPanel";
import { ExpandTrustNetworkCard } from "@/components/employee/ExpandTrustNetworkCard";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";
import { VerificationInbox } from "@/components/verification/VerificationInbox";
import { Button } from "@/components/ui/button";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

/**
 * Employee Dashboard — Trust Command Center.
 * Section 1: TrustScoreCard, TrustForecastCard, VerificationCoverageCard
 * Section 2: TrustRadar (primary visual)
 * Section 3: TrustNetworkPanel | IndustryBenchmarkCard
 * Section 4: TrustTimeline (verifications, references, trust events)
 * Section 5: ExpandTrustNetworkCard (invite coworkers, verify employment, strengthen profile)
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
    <div className="trust-command-center min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <style>{`
        .trust-command-center [data-card] {
          border-radius: 0.75rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Trust Command Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your trust strength, network, and next actions at a glance.
          </p>
        </header>

        {/* SECTION 1 — Top summary strip: TrustScoreCard, TrustForecastCard, VerificationCoverageCard */}
        <section aria-label="Trust summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrustScoreCardClient />
            <TrustForecastCard />
            <VerificationCoverageCard />
          </div>
        </section>

        {/* SECTION 2 — Primary visual: TrustRadar full width centered */}
        <section aria-label="Trust radar">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-4xl">
              <TrustRadarChart />
            </div>
          </div>
        </section>

        {/* SECTION 3 — Network + Benchmark: split layout */}
        <section aria-label="Network and benchmark">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrustNetworkPanel />
            <IndustryBenchmarkCard />
          </div>
        </section>

        {/* SECTION 4 — Activity: TrustTimeline full width */}
        <section aria-label="Trust activity">
          <TrustTimeline />
        </section>

        {/* SECTION 5 — Action panel: ExpandTrustNetworkCard */}
        <section aria-label="Expand trust network">
          <ExpandTrustNetworkCard onRequestVerification={() => setRequestModalOpen(true)} />
        </section>

        {/* Verification inbox (compact): pending requests */}
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
