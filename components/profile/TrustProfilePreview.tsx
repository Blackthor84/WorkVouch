"use client";

import { StatusPill } from "./StatusPill";
import { TrustScoreRing } from "./TrustScoreRing";
import { cn } from "@/lib/utils";

export interface TrustProfilePreviewData {
  fullName: string;
  position: string;
  company: string;
  verified: boolean;
  trustScore: number;
  referencesCount: number;
  rehireEligible: boolean;
  summary: string;
}

const DEFAULT_PREVIEW: TrustProfilePreviewData = {
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
  /** Override with industry-specific or custom data; omit for default preview */
  preview?: TrustProfilePreviewData;
  className?: string;
}

export function TrustProfilePreview({ preview: previewProp, className }: TrustProfilePreviewProps) {
  const preview = previewProp ?? DEFAULT_PREVIEW;

  return (
    <div
      className={cn(
        "mx-auto max-w-md rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
    >
      {/* Top */}
      <div>
        <h3 className="text-xl font-bold text-[#1E293B] dark:text-slate-100">{preview.fullName}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {preview.position} @ {preview.company}
        </p>
        {preview.verified && (
          <div className="mt-2">
            <StatusPill label="Verified" variant="verified" />
          </div>
        )}
      </div>

      {/* Middle */}
      <div className="mt-6 flex items-center gap-6">
        <TrustScoreRing score={preview.trustScore} size="md" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#1E293B] dark:text-slate-200">
            {preview.referencesCount} references
          </p>
          {preview.rehireEligible && (
            <StatusPill label="Rehire Eligible" variant="approved" />
          )}
        </div>
      </div>

      {/* Bottom */}
      <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">{preview.summary}</p>
    </div>
  );
}
