"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import DashboardActions from "@/components/DashboardActions";
import ConfidenceScore from "@/components/ConfidenceScore";
import { Button } from "@/components/ui/button";
import { PaperAirplaneIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { InviteCoworkerForm } from "@/components/dashboard/InviteCoworkerForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * Employee Dashboard — YC-style SaaS layout (Stripe / Notion / Linear).
 * LEFT: Sidebar (Dashboard, Verified Work History, Resume, Coworker Verifications, Network, Settings)
 * TOP: Primary actions — + Add Verified Job, Upload Resume, Request Verification
 * CENTER: Confidence Score (Employment Trust Score: progress bar + Verified Coworkers / Job History / Resume Consistency)
 * BOTTOM: Verified Work History, Verification Requests, Coworker Activity, Trust panels
 */
export default function WorkerDashboard() {
  const searchParams = useSearchParams();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [inviteFormOpen, setInviteFormOpen] = useState(false);

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
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Employment Trust Score — verification and trust for your resume.
          </p>
        </header>

        {/* TOP: Primary actions — Add Verified Job, Upload Resume, Request Verification */}
        <DashboardActions onRequestVerification={() => setRequestModalOpen(true)} />

        {/* Confidence Score — core product value (progress bar + Verified Coworkers / Job History / Resume Consistency) */}
        <ConfidenceScore />

        {/* Job History / Trust Score / Recent Verifications */}
        {/* Verified Work History */}
        <section aria-label="Verified Work History">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Verified Work History</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/my-jobs">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Jobs verified by coworkers increase your Confidence Score.
              </p>
              <Button asChild className="inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/profile">+ Add Verified Job</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Recent Verification Requests */}
        <section aria-label="Verification Requests">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Verification Requests
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

        {/* BOTTOM: Coworker Activity + Trust data */}
        <section aria-label="Coworker Activity">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Coworker Activity
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrustNetworkPanel />
            <IndustryBenchmarkCard />
          </div>
          <div className="mt-6">
            <TrustTimeline />
          </div>
        </section>

        {/* Trust radar + expand network */}
        <section aria-label="Trust radar">
          <div className="w-full max-w-4xl mx-auto">
            <TrustRadarChart />
          </div>
        </section>
        <section aria-label="Expand trust network">
          <div className="flex flex-wrap gap-3 mb-4">
            <Button
              variant="secondary"
              onClick={() => setInviteFormOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <UserPlusIcon className="h-5 w-5" />
              Invite Coworker
            </Button>
          </div>
          {inviteFormOpen && (
            <div className="mb-6">
              <InviteCoworkerForm onClose={() => setInviteFormOpen(false)} />
            </div>
          )}
          <ExpandTrustNetworkCard onRequestVerification={() => setRequestModalOpen(true)} />
        </section>

        {/* Trust summary cards */}
        <section aria-label="Trust summary" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <TrustScoreCardClient />
          <TrustForecastCard />
          <VerificationCoverageCard />
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
