"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { ghPanel } from "./panel-theme";

interface VerificationCardProps {
  verificationStatus: string;
  employmentVerified: boolean;
  managerReferences: number;
  coworkerReferences: number;
  referenceCompletionPct: number;
}

function statusIcon(status: string) {
  if (status === "verified") return <CheckCircle2 className="h-4 w-4 text-[#047957]" aria-hidden="true" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />;
  return <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />;
}

export function VerificationCard({
  verificationStatus,
  employmentVerified,
  managerReferences,
  coworkerReferences,
  referenceCompletionPct,
}: VerificationCardProps) {
  const label =
    verificationStatus === "verified"
      ? "Verified"
      : verificationStatus === "in_progress"
        ? "In progress"
        : verificationStatus === "failed"
          ? "Failed"
          : "Not started";

  return (
    <section
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      aria-labelledby="wv-verification-heading"
    >
      <h2 id="wv-verification-heading" className={ghPanel.heading}>
        Verification Status
      </h2>

      <div className="mt-3 flex items-center gap-2">
        {statusIcon(verificationStatus)}
        <span className="text-sm font-medium capitalize text-[#15372c]">{label}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-[#8a9690]">Employment</dt>
          <dd className="mt-0.5 font-medium text-[#15372c]">
            {employmentVerified ? "Verified" : "Pending"}
          </dd>
        </div>
        <div>
          <dt className="text-[#8a9690]">Reference completion</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">{referenceCompletionPct}%</dd>
        </div>
        <div>
          <dt className="text-[#8a9690]">Manager references</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">{managerReferences}</dd>
        </div>
        <div>
          <dt className="text-[#8a9690]">Coworker references</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">{coworkerReferences}</dd>
        </div>
      </dl>
    </section>
  );
}
