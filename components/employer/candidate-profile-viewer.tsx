"use client";

import { useState, useEffect, type ComponentProps } from "react";
import {
  saveCandidate,
  unsaveCandidate,
  isCandidateSaved,
} from "@/lib/actions/employer/saved-candidates";
import { sendMessage } from "@/lib/actions/employer/messages";
import { Card } from "../ui/card";
import { WvButton, WvBadge, WvErrorState } from "@/components/wv";
import {
  Bookmark,
  BookmarkMinus,
  Send,
  BadgeCheck,
  Database,
} from "lucide-react";
import { WorkHistoryViewer } from "./work-history-viewer";
import { ReferenceViewer } from "./reference-viewer";
import { WorkVouchInsightsSection } from "./workvouch-insights-section";
import EmployerRiskOverlay from "@/components/employer/EmployerRiskOverlay";
import { HiringConfidenceCard } from "@/components/employer/HiringConfidenceCard";
import { HiringOutcomePrompt } from "@/components/employer/HiringOutcomePrompt";
import { VerificationCoverageCardCandidate } from "@/components/employer/VerificationCoverageCardCandidate";
import { CandidateVerificationSummary } from "@/components/employer/CandidateVerificationSummary";
import { TrustGraphDepthCardCandidate } from "@/components/employer/TrustGraphDepthCardCandidate";
import Link from "next/link";
import { TrustRadarChart } from "@/components/trust/TrustRadarChart";
import { TrustForecastCard } from "@/components/trust/TrustForecastCard";
import { IndustryBenchmarkCard } from "@/components/trust/IndustryBenchmarkCard";
import { TrustPolicyMatchPanel } from "@/components/trust/TrustPolicyMatchPanel";
import { TrustAutomationPanel } from "@/components/trust/TrustAutomationPanel";
import { RiskAlertPanel } from "@/components/employer/RiskAlertPanel";
import { EmploymentVerificationPanel } from "@/components/employer/EmploymentVerificationPanel";
import { ReferenceConsistencyPanel } from "@/components/employer/ReferenceConsistencyPanel";
import { TrustTimelinePanel } from "@/components/employer/TrustTimelinePanel";
import { TrustCardEmployerView } from "@/components/trust/TrustCardEmployerView";
import { TrustRankInlineBadge } from "@/components/trust/TrustRankInlineBadge";
import VerifiedWorkTimeline from "@/components/trust/VerifiedWorkTimeline";
import { CandidateComparisonPanel } from "@/components/employer/CandidateComparisonPanel";
import { EmployerNotesPanel } from "@/components/employer/EmployerNotesPanel";
import { TeamSharingPanel } from "@/components/employer/TeamSharingPanel";
import VerticalBadges from "@/components/VerticalBadges";
import { HiringDataUnlockGate } from "@/components/employer/HiringDataUnlockGate";
import { SmartInsight } from "@/components/guidance/SmartInsight";
import { SuggestedActions } from "@/components/guidance/SuggestedActions";
import { TrustScoreHint, ConfidenceHint, RiskHint } from "@/components/guidance/TrustMetricHints";
import { HiringGuidanceCoachmarks } from "@/components/guidance/HiringGuidanceCoachmarks";

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
  /** Reviews counted in trust rank (trust_scores.reference_count). */
  trust_reference_count?: number;
  verified_employment_coverage_pct?: number;
  verified_employment_count?: number;
  total_employment_count?: number;
  industry_fields?: unknown[];
};

interface CandidateProfileViewerProps {
  candidateData: CandidateData;
  /** When true, employee is viewing their own profile as employers see it; hide employer actions and show banner. */
  isEmployeeSelfView?: boolean;
  hiringDataUnlocked?: boolean;
}

export function CandidateProfileViewer({
  candidateData,
  isEmployeeSelfView = false,
  hiringDataUnlocked = true,
}: CandidateProfileViewerProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [trustDetailsExpanded, setTrustDetailsExpanded] = useState(false);
  const [employerConfidenceLabel, setEmployerConfidenceLabel] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isEmployeeSelfView) checkSavedStatus();
    else setLoading(false);
  }, [isEmployeeSelfView]);

  useEffect(() => {
    if (isEmployeeSelfView || !candidateData.profile?.id) return;
    let cancelled = false;
    fetch(`/api/employer/confidence/${candidateData.profile.id}`, { credentials: "include" })
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        if (!cancelled && d?.confidenceLevel) setEmployerConfidenceLabel(String(d.confidenceLevel));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEmployeeSelfView, candidateData.profile?.id]);

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
    setActionNotice(null);
    try {
      if (saved) {
        await unsaveCandidate(profileId);
        setSaved(false);
        setActionNotice({ type: "success", message: "Removed from saved list." });
      } else {
        await saveCandidate(profileId);
        setSaved(true);
        setActionNotice({ type: "success", message: "Candidate saved." });
      }
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update saved status",
      });
    }
  };

  const handleSendMessage = async () => {
    const profileId = candidateData.profile?.id;
    if (!messageBody.trim() || !profileId) return;

    setActionNotice(null);
    try {
      await sendMessage(profileId, messageBody);
      setMessageBody("");
      setShowMessageForm(false);
      setActionNotice({ type: "success", message: "Message sent." });
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send message",
      });
    }
  };

  const {
    profile,
    jobs,
    references,
    trust_score,
    trust_reference_count,
    verified_employment_coverage_pct,
    verified_employment_count,
    total_employment_count,
    industry_fields,
  } = candidateData;

  const trustReviewsUnlocked = isEmployeeSelfView || hiringDataUnlocked;

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
        headline: (profile as { headline?: string | null }).headline ?? null,
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
    return (
      <WvErrorState
        title="Profile unavailable"
        message="This candidate profile could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-6">
      <HiringGuidanceCoachmarks enabled={!isEmployeeSelfView} />
      {actionNotice && (
        <p
          role={actionNotice.type === "error" ? "alert" : "status"}
          className={
            actionNotice.type === "error"
              ? "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              : "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
          }
        >
          {actionNotice.message}
        </p>
      )}
      {isEmployeeSelfView && (
        <WvBadge variant="brand" className="block w-fit px-3 py-2 text-sm">
          Preview — employer view of your profile
        </WvBadge>
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
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 flex items-center justify-center ring-1 ring-wv-border">
              <span className="text-wv-brand-blue font-semibold text-2xl">
                {safeProfile.full_name?.charAt(0) || "U"}
              </span>
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-wv-foreground">
                {safeProfile.full_name}
              </h1>
              <TrustRankInlineBadge
                score={Math.round(trust_score ?? 0)}
                reviewCount={trust_reference_count ?? 0}
                className="mt-0.5"
              />
            </div>
            {safeProfile.headline ? (
              <p className="text-base text-wv-muted mt-1 max-w-2xl">
                {safeProfile.headline}
              </p>
            ) : null}
            <p className="text-wv-muted">
              {safeProfile.state ? safeProfile.state : "Location not specified"}
            </p>
            {(verified_employment_count ?? 0) > 0 && (
              <WvBadge variant="success" className="mt-2 gap-1.5 px-3 py-1">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Verified candidate
              </WvBadge>
            )}
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
        <div className="flex gap-2" id={!isEmployeeSelfView ? "wv-guide-actions" : undefined}>
          <WvButton variant="secondary" onClick={handleSave} disabled={loading}>
            {saved ? (
              <>
                <BookmarkMinus className="h-5 w-5 mr-2" aria-hidden />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-5 w-5 mr-2" aria-hidden />
                Save candidate
              </>
            )}
          </WvButton>
          <WvButton variant="secondary" onClick={() => setShowMessageForm(!showMessageForm)}>
            <Send className="h-5 w-5 mr-2" aria-hidden />
            Message
          </WvButton>
        </div>
      </div>

      {/* Section 7 — Verified By / Total Confirmations */}
      {trustReviewsUnlocked ? (
        <CandidateVerificationSummary candidateId={safeProfile.id} />
      ) : (
        <HiringDataUnlockGate>
          <CandidateVerificationSummary candidateId={safeProfile.id} />
        </HiringDataUnlockGate>
      )}

      {/* Trust score — canonical engine via /api/trust */}
      {trustReviewsUnlocked ? (
        <div id="wv-guide-trust">
          <TrustScoreHint className="mb-3" />
          <TrustCardEmployerView profileId={safeProfile.id} fallbackScore={trust_score ?? 0} />
        </div>
      ) : (
        <HiringDataUnlockGate>
          <div id="wv-guide-trust">
            <TrustScoreHint className="mb-3" />
            <TrustCardEmployerView profileId={safeProfile.id} fallbackScore={trust_score ?? 0} />
          </div>
        </HiringDataUnlockGate>
      )}

      {/* Verified Work Timeline: jobs + manager/coworker verifications and trust impact */}
      {!trustReviewsUnlocked ? (
        <HiringDataUnlockGate>
          <VerifiedWorkTimeline profileId={safeProfile.id} />
        </HiringDataUnlockGate>
      ) : (
        <VerifiedWorkTimeline profileId={safeProfile.id} />
      )}

      {!isEmployeeSelfView && trustReviewsUnlocked && (
        <div
          id="wv-guide-insights"
          className="rounded-2xl border border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-900 p-4 space-y-3"
        >
          <SmartInsight
            trustScore={Math.round(trust_score ?? 0)}
            confidence={employerConfidenceLabel}
            referenceCount={trust_reference_count ?? 0}
          />
          <SuggestedActions
            trustScore={Math.round(trust_score ?? 0)}
            confidence={employerConfidenceLabel}
            referenceCount={trust_reference_count ?? 0}
            candidateId={safeProfile.id}
          />
        </div>
      )}

      {/* WorkVouch Insights + employer intelligence — premium hiring */}
      {!isEmployeeSelfView && trustReviewsUnlocked && (
        <>
      <WorkVouchInsightsSection candidateId={safeProfile.id} />

      <EmployerRiskOverlay candidateId={safeProfile.id} />

      {/* Employer Dashboard: decision panels (3 rows). When employee self-view, show single HiringConfidenceCard + score. */}
      <div className="space-y-6">
          {/* Trust signals: Outlook, Benchmark, Hiring Confidence, Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustForecastCard profileId={safeProfile.id} />
            <IndustryBenchmarkCard profileId={safeProfile.id} />
            <div id="wv-guide-confidence">
              <ConfidenceHint className="mb-2" />
              <HiringConfidenceCard candidateId={safeProfile.id} />
            </div>
            <div id="wv-guide-risk">
              <RiskHint className="mb-2" />
              <RiskAlertPanel candidateId={safeProfile.id} />
            </div>
          </div>
          {/* Top row: Verification, Depth, Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <VerificationCoverageCardCandidate candidateId={safeProfile.id} />
            <TrustGraphDepthCardCandidate candidateId={safeProfile.id} />
            <TrustTimelinePanel candidateId={safeProfile.id} />
          </div>
          <div className="flex flex-wrap gap-3">
            <WvButton href={`/employer/trust-graph/${safeProfile.id}`} variant="secondary">
              <Database className="h-5 w-5" aria-hidden />
              View trust graph
            </WvButton>
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
            <TrustRadarChart profileId={safeProfile.id} employerCandidateId={safeProfile.id} />
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
        </>
      )}

      {!isEmployeeSelfView && !trustReviewsUnlocked && (
        <HiringDataUnlockGate>
          <div className="min-h-[160px] rounded-xl border border-slate-200 bg-white p-8 text-center dark:bg-[#111827] dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Hiring intelligence, benchmarks, and deep trust analytics unlock with a paid plan.
            </p>
          </div>
        </HiringDataUnlockGate>
      )}

      {isEmployeeSelfView ? (
        <>
          <HiringConfidenceCard candidateId={safeProfile.id} />
          <Card className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1">Trust score</h2>
                <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">Verified credibility score (0–100)</p>
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
      ) : null}

      {/* Message Form */}
      {showMessageForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Send message
          </h3>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={4}
            placeholder="Write your message…"
            className="mb-4 w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-3 text-sm text-wv-foreground placeholder:text-white/30 focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30"
          />
          <div className="flex gap-2">
            <WvButton onClick={handleSendMessage}>Send message</WvButton>
            <WvButton variant="ghost" onClick={() => setShowMessageForm(false)}>
              Cancel
            </WvButton>
          </div>
        </Card>
      )}

      {/* Verified Work History */}
      <WorkHistoryViewer jobs={safeJobs} />

      {/* Peer References */}
      {trustReviewsUnlocked ? (
        <ReferenceViewer references={(references ?? []) as unknown as ComponentProps<typeof ReferenceViewer>["references"]} />
      ) : (
        <HiringDataUnlockGate>
          <ReferenceViewer references={(references ?? []) as unknown as ComponentProps<typeof ReferenceViewer>["references"]} />
        </HiringDataUnlockGate>
      )}

      {!isEmployeeSelfView && (
        /* Optional hiring outcome feedback (dismissible; stored for aggregate use only) */
        <HiringOutcomePrompt candidateId={safeProfile.id as string} />
      )}

      {/* Industry Fields */}
      {industry_fields && Array.isArray(industry_fields) && industry_fields.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Industry credentials
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
                    <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
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
