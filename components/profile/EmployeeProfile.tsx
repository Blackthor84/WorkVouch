"use client";

import { StatusPill, type StatusVariant } from "./StatusPill";
import { TrustScoreRing } from "./TrustScoreRing";
import { ProfileCard, ProfileCardTitle, ProfileCardContent } from "./ProfileCard";

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

export interface EmployeeProfileProps {
  /** Override dummy data for preview; omit to use static dummy data */
  profile?: typeof DUMMY_PROFILE;
  className?: string;
}

export function EmployeeProfile({ profile = DUMMY_PROFILE, className }: EmployeeProfileProps) {
  const riskVariant: StatusVariant = profile.riskTier === "low" ? "low" : profile.riskTier === "moderate" ? "moderate" : "high";
  const rehireConfig =
    rehireConfigMap[profile.rehireStatus] ?? rehireConfigMap.NotEligible;

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
            <StatusPill label={profile.riskTier.charAt(0).toUpperCase() + profile.riskTier.slice(1)} variant={riskVariant} />
          </div>
        </div>
        <div className="shrink-0 sm:ml-4">
          <TrustScoreRing score={profile.trustScore} size="lg" />
        </div>
      </div>

      {/* Trust Summary */}
      <ProfileCard className="mt-6" hover>
        <ProfileCardTitle>Trust Summary</ProfileCardTitle>
        <ProfileCardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-[#1E293B] dark:text-slate-200">Trust Score: {profile.trustScore}</span>
            <StatusPill label={profile.riskTier.charAt(0).toUpperCase() + profile.riskTier.slice(1)} variant={riskVariant} />
            <StatusPill label={profile.rehireEligibility} variant="approved" />
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
              <li key={i} className="border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700">
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
                  <span className="text-slate-500 dark:text-slate-500">Peer confirmations: {job.peerConfirmations}</span>
                  <span className="text-slate-500 dark:text-slate-500">Attendance flags: {job.attendanceFlags}</span>
                  <StatusPill label={job.performanceTrend} variant={job.performanceTrend === "positive" ? "low" : job.performanceTrend === "stable" ? "neutral" : "moderate"} />
                </div>
              </li>
            ))}
          </ul>
        </ProfileCardContent>
      </ProfileCard>

      {/* Rehire Registry */}
      <ProfileCard className="mt-6" hover>
        <ProfileCardTitle>Rehire Registry</ProfileCardTitle>
        <ProfileCardContent>
          <div className="mb-3">
            <StatusPill
              label={rehireConfig.label}
              variant={rehireConfig.variant}
            />
          </div>
          <blockquote className="rounded-lg border-l-4 border-slate-200 bg-slate-50 px-4 py-3 text-sm italic text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
            {profile.rehireQuote}
          </blockquote>
        </ProfileCardContent>
      </ProfileCard>
    </div>
  );
}
