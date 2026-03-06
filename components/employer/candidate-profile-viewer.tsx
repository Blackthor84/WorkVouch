"use client";

import { useState, useEffect, type ComponentProps } from "react";
import {
  saveCandidate,
  unsaveCandidate,
  isCandidateSaved,
} from "@/lib/actions/employer/saved-candidates";
import { sendMessage } from "@/lib/actions/employer/messages";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  PaperAirplaneIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { WorkHistoryViewer } from "./work-history-viewer";
import { ReferenceViewer } from "./reference-viewer";
import { WorkVouchInsightsSection } from "./workvouch-insights-section";
import EmployerRiskOverlay from "@/components/employer/EmployerRiskOverlay";
import { HiringConfidenceCard } from "@/components/employer/HiringConfidenceCard";
import { HiringOutcomePrompt } from "@/components/employer/HiringOutcomePrompt";
import { VerificationCoverageCardCandidate } from "@/components/employer/VerificationCoverageCardCandidate";
import { CandidateVerificationSummary } from "@/components/employer/CandidateVerificationSummary";
import { TrustGraphDepthCardCandidate } from "@/components/employer/TrustGraphDepthCardCandidate";
import { TrustRadarChart } from "@/components/trust/TrustRadarChart";
import { TrustForecastCard } from "@/components/trust/TrustForecastCard";
import { IndustryBenchmarkCard } from "@/components/trust/IndustryBenchmarkCard";
import { TrustPolicyMatchPanel } from "@/components/trust/TrustPolicyMatchPanel";
import { TrustAutomationPanel } from "@/components/trust/TrustAutomationPanel";
import { RiskAlertPanel } from "@/components/employer/RiskAlertPanel";
import { EmploymentVerificationPanel } from "@/components/employer/EmploymentVerificationPanel";
import { ReferenceConsistencyPanel } from "@/components/employer/ReferenceConsistencyPanel";
import { TrustTimelinePanel } from "@/components/employer/TrustTimelinePanel";
import { CandidateComparisonPanel } from "@/components/employer/CandidateComparisonPanel";
import { EmployerNotesPanel } from "@/components/employer/EmployerNotesPanel";
import { TeamSharingPanel } from "@/components/employer/TeamSharingPanel";
import VerticalBadges from "@/components/VerticalBadges";

type CandidateData = {
  profile?: {
    id: string;
    full_name?: string;
    email?: string;
    profile_photo_url?: string | null;
    city?: string | null;
    state?: string | null;
    industry?: string | null;
    vertical?: string | null;
    role?: string | null;
  } | null;
  jobs?: Array<Record<string, unknown>>;
  references?: Array<Record<string, unknown>>;
  trust_score?: number;
  verified_employment_coverage_pct?: number;
  verified_employment_count?: number;
  total_employment_count?: number;
  industry_fields?: unknown[];
};

interface CandidateProfileViewerProps {
  candidateData: CandidateData;
  /** When true, employee is viewing their own profile as employers see it; hide employer actions and show banner. */
  isEmployeeSelfView?: boolean;
}

export function CandidateProfileViewer({
  candidateData,
  isEmployeeSelfView = false,
}: CandidateProfileViewerProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [trustDetailsExpanded, setTrustDetailsExpanded] = useState(false);

  useEffect(() => {
    if (!isEmployeeSelfView) checkSavedStatus();
    else setLoading(false);
  }, [isEmployeeSelfView]);

  const checkSavedStatus = async () => {
    if (!candidateData.profile?.id) return;
    try {
      const status = await isCandidateSaved(candidateData.profile.id);
      setSaved(status);
    } catch (error) {
      console.error("Failed to check saved status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const profileId = candidateData.profile?.id;
    if (!profileId) return;
    try {
      if (saved) {
        await unsaveCandidate(profileId);
        setSaved(false);
      } else {
        await saveCandidate(profileId);
        setSaved(true);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update saved status");
    }
  };

  const handleSendMessage = async () => {
    const profileId = candidateData.profile?.id;
    if (!messageBody.trim() || !profileId) return;

    try {
      await sendMessage(profileId, messageBody);
      setMessageBody("");
      setShowMessageForm(false);
      alert("Message sent!");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const { profile, jobs, references, trust_score, verified_employment_coverage_pct, verified_employment_count, total_employment_count, industry_fields } =
    candidateData;

  // Normalize profile: convert string | null to string
  const safeProfile = profile
    ? {
        id: profile.id,
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        profile_photo_url: profile.profile_photo_url,
        city: profile.city,
        state: profile.state,
        industry: profile.industry,
        vertical: profile.vertical,
        role: profile.role,
      }
    : null;

  // Normalize jobs: convert string | null to string
  const safeJobs = Array.isArray(jobs)
    ? jobs.map((job: Record<string, unknown>) => ({
        ...job,
        company_name: (job.company_name as string) ?? "",
        job_title: (job.job_title as string) ?? "",
      }))
    : [];

  if (!safeProfile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      {isEmployeeSelfView && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-200" role="status">
          This is exactly what employers see when viewing your profile.
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {safeProfile.profile_photo_url ? (
            <img
              src={safeProfile.profile_photo_url}
              alt={safeProfile.full_name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-2xl">
                {safeProfile.full_name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
              {safeProfile.full_name}
            </h1>
            <p className="text-grey-medium dark:text-gray-400">
              {safeProfile.city && safeProfile.state
                ? `${safeProfile.city}, ${safeProfile.state}`
                : "Location not specified"}
            </p>
            {safeProfile.industry && (
              <p className="text-sm text-grey-medium dark:text-gray-400 capitalize">
                {safeProfile.industry.replace("_", " ")}
              </p>
            )}
            <VerticalBadges
              profile={{
                industry: safeProfile.industry ?? undefined,
                vertical: safeProfile.vertical ?? undefined,
                role: safeProfile.role ?? undefined,
              }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave} disabled={loading}>
            {saved ? (
              <>
                <BookmarkSlashIcon className="h-5 w-5 mr-2" />
                Saved
              </>
            ) : (
              <>
                <BookmarkIcon className="h-5 w-5 mr-2" />
                Save Candidate
              </>
            )}
          </Button>
          <Button onClick={() => setShowMessageForm(!showMessageForm)}>
            <PaperAirplaneIcon className="h-5 w-5 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* Section 7 — Verified By / Total Confirmations */}
      <CandidateVerificationSummary candidateId={safeProfile.id} />

      {/* WorkVouch Insights (employer-only, feature-flagged) */}
      <WorkVouchInsightsSection candidateId={safeProfile.id} />

      {/* Employer-only risk overlay (Career Health + Rehire, Velocity, Risk Flag, Network, Fraud confidence) */}
      <EmployerRiskOverlay candidateId={safeProfile.id} />

      {/* Employer Dashboard: decision panels (3 rows). When employee self-view, show single HiringConfidenceCard + score. */}
      {!isEmployeeSelfView ? (
        <div className="space-y-6">
          {/* Trust signals: Outlook, Benchmark, Hiring Confidence, Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustForecastCard profileId={safeProfile.id} />
            <IndustryBenchmarkCard profileId={safeProfile.id} />
            <HiringConfidenceCard candidateId={safeProfile.id} />
            <RiskAlertPanel candidateId={safeProfile.id} />
          </div>
          {/* Top row: Verification, Depth, Timeline, Trust Policy Match */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VerificationCoverageCardCandidate candidateId={safeProfile.id} />
            <TrustGraphDepthCardCandidate candidateId={safeProfile.id} />
            <TrustTimelinePanel candidateId={safeProfile.id} />
          </div>
          {/* Trust Policy Match: candidate vs employer hiring standards */}
          <div className="grid grid-cols-1 gap-6">
            <TrustPolicyMatchPanel candidateId={safeProfile.id} />
          </div>
          {/* Automation Triggers: rules run when trust events occur for this candidate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrustAutomationPanel compact />
          </div>
          {/* Middle row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TrustRadarChart profileId={safeProfile.id} />
            <EmploymentVerificationPanel candidateId={safeProfile.id} />
            <ReferenceConsistencyPanel candidateId={safeProfile.id} />
          </div>
          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CandidateComparisonPanel candidateId={safeProfile.id} />
            <EmployerNotesPanel candidateId={safeProfile.id} />
            <TeamSharingPanel candidateId={safeProfile.id} />
          </div>
        </div>
      ) : (
        <>
          <HiringConfidenceCard candidateId={safeProfile.id} />
          <Card className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1">Reputation Score</h2>
                <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">Portable credibility score (0–100)</p>
                <ul className="text-sm text-grey-dark dark:text-gray-200 space-y-0.5 list-disc list-inside">
                  {typeof total_employment_count === "number" && total_employment_count > 0 && (
                    <li title="Percentage of listed roles confirmed through independent verification.">
                      {typeof verified_employment_coverage_pct === "number"
                        ? `${verified_employment_coverage_pct}% of employment independently verified`
                        : "0% of employment independently verified"}
                    </li>
                  )}
                  <li>References: {references?.length ?? 0}</li>
                  {Array.isArray(references) && references.length > 0 && (
                    <li>
                      Avg rating:{" "}
                      {(references.reduce((s: number, r: { rating?: number }) => s + (r.rating ?? 0), 0) / references.length).toFixed(1)}/5
                    </li>
                  )}
                  {trustDetailsExpanded && (
                    <li>Verified roles: {verified_employment_count ?? 0} of {total_employment_count ?? 0}</li>
                  )}
                </ul>
                <button
                  type="button"
                  onClick={() => setTrustDetailsExpanded(!trustDetailsExpanded)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  {trustDetailsExpanded ? "Hide details" : "Show details"}
                </button>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{trust_score}</div>
            </div>
          </Card>
        </>
      )}

      {/* Message Form */}
      {showMessageForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Send Message
          </h3>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={4}
            placeholder="Type your message..."
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2 mb-4"
          />
          <div className="flex gap-2">
            <Button onClick={handleSendMessage}>Send Message</Button>
            <Button variant="ghost" onClick={() => setShowMessageForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Verified Work History */}
      <WorkHistoryViewer jobs={safeJobs} />

      {/* Peer References */}
      <ReferenceViewer references={(references ?? []) as unknown as ComponentProps<typeof ReferenceViewer>["references"]} />

      {!isEmployeeSelfView && (
        /* Optional hiring outcome feedback (dismissible; stored for aggregate use only) */
        <HiringOutcomePrompt candidateId={safeProfile.id as string} />
      )}

      {/* Industry Fields */}
      {industry_fields && Array.isArray(industry_fields) && industry_fields.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Industry-Specific Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(industry_fields as Record<string, unknown>[]).map((field: Record<string, unknown>, idx: number) => (
              <div
                key={idx}
                className="p-4 bg-grey-background dark:bg-[#1A1F2B] rounded-xl"
              >
                <p className="text-sm font-semibold text-grey-medium dark:text-gray-400 mb-1">
                  {String(field.field_name ?? "")}
                </p>
                <p className="text-grey-dark dark:text-gray-200">
                  {String(field.field_value ?? "Not specified")}
                </p>
                {Boolean(field.verified) && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckBadgeIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                      Verified
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
