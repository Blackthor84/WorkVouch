"use client";

import { UserSearch, Link2Off } from "lucide-react";
import { ghPanel } from "./panel-theme";

export function PanelNotLinkedState({ candidateName }: { candidateName?: string }) {
  return (
    <div
      className={`${ghPanel.card} ${ghPanel.cardPadding} text-center`}
      role="status"
      aria-label="Candidate not linked to WorkVouch"
    >
      <Link2Off className="mx-auto h-8 w-8 text-[#8a9690]" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-[#15372c]">Not linked to WorkVouch</p>
      <p className="mt-1 text-xs text-[#5c6c66]">
        {candidateName
          ? `${candidateName} will appear here once matched by email or invited.`
          : "Trust and verification data will appear once the candidate is linked."}
      </p>
    </div>
  );
}

export function PanelNoTrustState() {
  return (
    <div className={`${ghPanel.card} ${ghPanel.cardPadding}`} role="status">
      <UserSearch className="h-6 w-6 text-[#8a9690]" aria-hidden="true" />
      <p className="mt-2 text-sm font-medium">Verification in progress</p>
      <p className="mt-1 text-xs text-[#5c6c66]">
        Trust score will appear after employment verification completes.
      </p>
    </div>
  );
}

export function PanelEmptyTimelineState() {
  return (
    <p className="text-xs text-[#5c6c66]" role="status">
      No verified employment timeline yet.
    </p>
  );
}

export function PanelEmptyReferencesState() {
  return (
    <p className="text-xs text-[#5c6c66]" role="status">
      No references collected yet.
    </p>
  );
}
