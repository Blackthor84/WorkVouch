"use client";

import { StatusPill } from "./StatusPill";
import { TrustScoreRing } from "./TrustScoreRing";
import { cn } from "@/lib/utils";

// Static dummy data for homepage preview
const PREVIEW = {
  fullName: "Sarah Chen",
  position: "Senior Security Officer",
  company: "Sentinel Security Group",
  verified: true,
  trustScore: 87,
  referencesCount: 12,
  rehireEligible: true,
  summary: "Verified professional with strong peer confirmations and positive employment history.",
};

export interface TrustProfilePreviewProps {
  className?: string;
}

export function TrustProfilePreview({ className }: TrustProfilePreviewProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-md rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
    >
      {/* Top */}
      <div>
        <h3 className="text-xl font-bold text-[#1E293B] dark:text-slate-100">{PREVIEW.fullName}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {PREVIEW.position} @ {PREVIEW.company}
        </p>
        {PREVIEW.verified && (
          <div className="mt-2">
            <StatusPill label="Verified" variant="verified" />
          </div>
        )}
      </div>

      {/* Middle */}
      <div className="mt-6 flex items-center gap-6">
        <TrustScoreRing score={PREVIEW.trustScore} size="md" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#1E293B] dark:text-slate-200">
            {PREVIEW.referencesCount} references
          </p>
          {PREVIEW.rehireEligible && (
            <StatusPill label="Rehire Eligible" variant="approved" />
          )}
        </div>
      </div>

      {/* Bottom */}
      <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">{PREVIEW.summary}</p>
    </div>
  );
}
