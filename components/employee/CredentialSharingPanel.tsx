"use client";

import { ShareCredentialCard } from "@/components/workvouch/ShareCredentialCard";

/**
 * Decision panel: create and share WorkVouch credentials (live API, no placeholder).
 */
export function CredentialSharingPanel() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Credential sharing
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Create a shareable link to your WorkVouch credential for employers or applications.
      </p>
      <ShareCredentialCard />
    </div>
  );
}
