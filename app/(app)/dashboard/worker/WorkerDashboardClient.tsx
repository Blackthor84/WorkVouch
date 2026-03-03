"use client";

import { EmployerViewMirrorPanel } from "@/components/employee/EmployerViewMirrorPanel";
import { TrustSnapshotPanel } from "@/components/employee/TrustSnapshotPanel";
import { EmployeeHiringConfidencePanel } from "@/components/employee/EmployeeHiringConfidencePanel";
import { TrustActivityTimeline } from "@/components/employee/TrustActivityTimeline";
import { VisibilityCommandCenter } from "@/components/employee/VisibilityCommandCenter";
import { ReferencePowerInsight } from "@/components/employee/ReferencePowerInsight";
import { CredentialCommandCenter } from "@/components/employee/CredentialCommandCenter";
import { TrustTrajectoryCoaching } from "@/components/employee/TrustTrajectoryCoaching";

/**
 * Employee Dashboard — power, control, clarity.
 * Sections 1–8 in order; every section wired to real data. No placeholders. No any.
 */
export default function WorkerDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Trust Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your professional identity at a glance. Everything below is real data.
          </p>
        </header>

        {/* Section 1 — Employer View Mirror (primary) */}
        <EmployerViewMirrorPanel />

        {/* Section 2 — Trust Snapshot */}
        <TrustSnapshotPanel />

        {/* Section 3 — Hiring Confidence (employer lens) */}
        <EmployeeHiringConfidencePanel />

        {/* Section 4 — Trust Activity Timeline */}
        <TrustActivityTimeline />

        {/* Section 5 — Visibility Command Center */}
        <VisibilityCommandCenter />

        {/* Section 6 — Reference Power Insights */}
        <ReferencePowerInsight />

        {/* Section 7 — Credential Command Center */}
        <CredentialCommandCenter />

        {/* Section 8 — Trust Coaching (conditional: only when suggestions exist) */}
        <TrustTrajectoryCoaching />
      </div>
    </div>
  );
}
