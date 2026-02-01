"use client";

import { StatusPill, type StatusVariant } from "./StatusPill";
import { TrustScoreRing } from "./TrustScoreRing";
import { ProfileCard, ProfileCardTitle, ProfileCardContent } from "./ProfileCard";
import {
  ViewerAccessLevel,
  shouldShowRehireStatus,
  shouldShowRehireReasonCategory,
  shouldShowRehireDetailedExplanation,
  shouldShowRehireSafetyLabel,
  industryMatchesForRehire,
} from "@/lib/compliance-types";
import {
  REHIRE_INSIGHTS_PUBLIC_MESSAGE,
  PROFILE_REHIRE_DISCLAIMER,
} from "@/lib/verification-copy";

export type RehireStatus = "Approved" | "Review" | "NotEligible";

const rehireConfigMap: Record<
  RehireStatus,
  { label: string; variant: StatusVariant }
> = {
  Approved: {
    label: "Approved for Rehire",
    variant: "approved",
  },
  Review: {
    label: "Review Required",
    variant: "review",
  },
  NotEligible: {
    label: "Not Eligible for Rehire",
    variant: "not_eligible",
  },
};

/** Human-readable reason category labels (optional display). */
const REASON_CATEGORY_LABELS: Record<string, string> = {
  AttendanceIssues: "Attendance issues",
  PolicyViolation: "Policy violation",
  PerformanceConcerns: "Performance concerns",
  ContractCompletion: "Contract completion",
  RoleEliminated: "Role eliminated",
  Other: "Other",
};

// ——— Dummy data for preview ———
const DUMMY_PROFILE = {
  fullName: "Sarah Chen",
  position: "Senior Security Officer",
  company: "Sentinel Security Group",
  verified: true,
  trustScore: 87,
  referencesCount: 12,
  peerMatchPercent: 94,
  riskTier: "low" as const,
  rehireEligibility: "Eligible for rehire",
  rehireStatus: "Approved" as RehireStatus,
  rehireQuote: "Consistently reliable. Strong attendance and clear communication. Would hire again.",
  summary: "Verified professional with strong peer confirmations and positive employment history.",
  employment: [
    {
      companyName: "Sentinel Security Group",
      startDate: "Mar 2021",
      endDate: "Present",
      position: "Senior Security Officer",
      verified: true,
      peerConfirmations: 8,
      attendanceFlags: 0,
      performanceTrend: "positive" as const,
    },
    {
      companyName: "Metro Guard Services",
      startDate: "Jun 2018",
      endDate: "Feb 2021",
      position: "Security Officer",
      verified: true,
      peerConfirmations: 6,
      attendanceFlags: 1,
      performanceTrend: "stable" as const,
    },
  ],
};

export interface EmployeeProfileRehireData {
  rehireStatus: RehireStatus;
  rehireQuote?: string | null;
  reasonCategory?: string | null;
  detailedExplanation?: string | null;
}

/** Single version record for Admin view (from rehire_evaluation_versions). */
export interface RehireVersionRecord {
  id: string;
  rehire_status: string | null;
  reason: string | null;
  detailed_explanation: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface EmployeeProfileProps {
  /** Override dummy data for preview; omit to use static dummy data */
  profile?: typeof DUMMY_PROFILE;
  /** Who is viewing; controls visibility of rehire recommendation. Default Public. */
  viewerAccessLevel?: ViewerAccessLevel;
  /** If true, VerifiedEmployer must match employee industry to view rehire recommendation. */
  requireIndustryMatchForRehireAccess?: boolean;
  /** @deprecated Use requireIndustryMatchForRehireAccess */
  requireIndustryMatch?: boolean;
  /** Employee's industry (for industry matching). */
  employeeIndustry?: string | null;
  /** Viewer's industry (e.g. employer's industry). */
  viewerIndustry?: string | null;
  /** Optional rehire data when profile comes from API (rehireStatus, reasonCategory, detailedExplanation). */
  rehireData?: EmployeeProfileRehireData | null;
  /** Version history for Admin view (from rehire_evaluation_versions). */
  rehireVersionHistory?: RehireVersionRecord[] | null;
  className?: string;
}

export function EmployeeProfile({
  profile = DUMMY_PROFILE,
  viewerAccessLevel = ViewerAccessLevel.Public,
  requireIndustryMatchForRehireAccess = false,
  requireIndustryMatch,
  employeeIndustry = null,
  viewerIndustry = null,
  rehireData = null,
  rehireVersionHistory = null,
  className,
}: EmployeeProfileProps) {
  const requireMatch =
    requireIndustryMatchForRehireAccess === true || requireIndustryMatch === true;
  const riskVariant: StatusVariant =
    profile.riskTier === "low" ? "low" : profile.riskTier === "moderate" ? "moderate" : "high";
  const rehireStatus = (rehireData?.rehireStatus ?? profile.rehireStatus) as RehireStatus;
  const rehireConfig = rehireConfigMap[rehireStatus] ?? rehireConfigMap.NotEligible;
  const rehireQuote = rehireData?.rehireQuote ?? profile.rehireQuote;
  const reasonCategory = rehireData?.reasonCategory ?? null;
  const detailedExplanation = rehireData?.detailedExplanation ?? null;

  const hasRecommendation = Boolean(rehireStatus);
  const industryOk = industryMatchesForRehire(employeeIndustry, viewerIndustry);
  const effectiveRehireAccess =
    viewerAccessLevel === ViewerAccessLevel.VerifiedEmployer && requireMatch && !industryOk
      ? ViewerAccessLevel.Public
      : viewerAccessLevel;
  const isAdmin = viewerAccessLevel === ViewerAccessLevel.Admin;
  const versions = rehireVersionHistory ?? [];

  const showRehireStatus = shouldShowRehireStatus(effectiveRehireAccess);
  const showReasonCategory = shouldShowRehireReasonCategory(effectiveRehireAccess);
  const showDetailedExplanation = shouldShowRehireDetailedExplanation(effectiveRehireAccess);
  const showSafetyLabel = shouldShowRehireSafetyLabel(effectiveRehireAccess, hasRecommendation);
  const showRehireSection =
    showRehireStatus || showReasonCategory || showDetailedExplanation || showSafetyLabel;

  return (
    <div className={className}>
      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] dark:text-slate-100 sm:text-3xl">
            {profile.fullName}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {profile.position} @ {profile.company}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {profile.verified && <StatusPill label="Verified" variant="verified" />}
            <span className="text-sm text-slate-500 dark:text-slate-500">
              {profile.referencesCount} references · {profile.peerMatchPercent}% peer match
            </span>
            <StatusPill
              label={profile.riskTier.charAt(0).toUpperCase() + profile.riskTier.slice(1)}
              variant={riskVariant}
            />
          </div>
        </div>
        <div className="shrink-0 sm:ml-4">
          <TrustScoreRing score={profile.trustScore} size="lg" />
        </div>
      </div>

      {/* Trust Summary — Public: trust score, employment, peer confirmations only; no rehire pill unless VerifiedEmployer/Admin */}
      <ProfileCard className="mt-6" hover>
        <ProfileCardTitle>Trust Summary</ProfileCardTitle>
        <ProfileCardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-[#1E293B] dark:text-slate-200">
              Trust Score: {profile.trustScore}
            </span>
            <StatusPill
              label={profile.riskTier.charAt(0).toUpperCase() + profile.riskTier.slice(1)}
              variant={riskVariant}
            />
            {showRehireStatus && (
              <StatusPill label={profile.rehireEligibility} variant="approved" />
            )}
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{profile.summary}</p>
        </ProfileCardContent>
      </ProfileCard>

      {/* Employment Record */}
      <ProfileCard className="mt-6" hover>
        <ProfileCardTitle>Employment Record</ProfileCardTitle>
        <ProfileCardContent>
          <ul className="space-y-4">
            {profile.employment.map((job, i) => (
              <li
                key={i}
                className="border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#1E293B] dark:text-slate-200">{job.companyName}</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {job.startDate} – {job.endDate}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">{job.position}</p>
                  </div>
                  {job.verified && <StatusPill label="Verified" variant="verified" />}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-500">
                    Peer confirmations: {job.peerConfirmations}
                  </span>
                  <span className="text-slate-500 dark:text-slate-500">
                    Attendance flags: {job.attendanceFlags}
                  </span>
                  <StatusPill
                    label={job.performanceTrend}
                    variant={
                      job.performanceTrend === "positive"
                        ? "low"
                        : job.performanceTrend === "stable"
                          ? "neutral"
                          : "moderate"
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </ProfileCardContent>
      </ProfileCard>

      {/* Rehire Registry — controlled by viewerAccessLevel */}
      {showRehireSection && (
        <ProfileCard className="mt-6" hover>
          <ProfileCardTitle>Rehire Registry</ProfileCardTitle>
          <ProfileCardContent>
            {showSafetyLabel && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {REHIRE_INSIGHTS_PUBLIC_MESSAGE}
              </p>
            )}
            {showRehireStatus && (
              <div className="mb-3">
                <StatusPill label={rehireConfig.label} variant={rehireConfig.variant} />
              </div>
            )}
            {showReasonCategory && reasonCategory && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Reason category: {REASON_CATEGORY_LABELS[reasonCategory] ?? reasonCategory}
              </p>
            )}
            {(showDetailedExplanation && detailedExplanation) || (showRehireStatus && rehireQuote) ? (
              <blockquote className="rounded-lg border-l-4 border-slate-200 bg-slate-50 px-4 py-3 text-sm italic text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                {showDetailedExplanation && detailedExplanation
                  ? detailedExplanation
                  : rehireQuote}
              </blockquote>
            ) : null}
            {isAdmin && versions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Version history
                </h4>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                  {versions.map((v) => (
                    <li key={v.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <span className="font-medium">{v.rehire_status ?? "—"}</span>
                      {v.reason != null && (
                        <span className="ml-2">· {REASON_CATEGORY_LABELS[v.reason] ?? v.reason}</span>
                      )}
                      {v.submitted_at != null && (
                        <span className="block mt-1 text-slate-500">
                          {new Date(v.submitted_at).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      {v.detailed_explanation != null && v.detailed_explanation.trim() !== "" && (
                        <p className="mt-2 italic">{v.detailed_explanation}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {PROFILE_REHIRE_DISCLAIMER}
            </p>
          </ProfileCardContent>
        </ProfileCard>
      )}
    </div>
  );
}
