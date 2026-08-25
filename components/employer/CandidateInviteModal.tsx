"use client";

import { WvButton } from "@/components/wv";
import type { DirectoryCandidate } from "@/lib/employer/candidates/directory-types";

type Props = {
  candidate: DirectoryCandidate;
  open: boolean;
  sending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function providerLabel(provider?: string): string {
  if (!provider) return "your ATS";
  if (provider === "greenhouse") return "Greenhouse";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function CandidateInviteModal({
  candidate,
  open,
  sending,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-invite-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-wv-border bg-[#12121a] p-6 shadow-2xl">
        <h2 id="candidate-invite-title" className="text-lg font-semibold text-wv-foreground">
          Invite {candidate.displayName} to WorkVouch
        </h2>
        <p className="mt-3 text-sm text-wv-muted">
          This candidate was imported from {providerLabel(candidate.provider)}. Invite them to
          claim their WorkVouch profile and connect it to this application.
        </p>

        <dl className="mt-5 space-y-3 rounded-xl border border-wv-border bg-wv-surface/60 p-4 text-sm">
          <div>
            <dt className="text-wv-subtle">Candidate</dt>
            <dd className="font-medium text-wv-foreground">{candidate.displayName}</dd>
          </div>
          <div>
            <dt className="text-wv-subtle">Provider</dt>
            <dd className="text-wv-foreground">{providerLabel(candidate.provider)}</dd>
          </div>
          {candidate.jobTitle && candidate.jobTitle !== "—" && (
            <div>
              <dt className="text-wv-subtle">Role / application</dt>
              <dd className="text-wv-foreground">{candidate.jobTitle}</dd>
            </div>
          )}
          {candidate.emailMasked && (
            <div>
              <dt className="text-wv-subtle">Email</dt>
              <dd className="text-wv-foreground">{candidate.emailMasked}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 text-xs text-wv-subtle">
          We will email the candidate a secure link to claim their profile. You will not be able to
          send another active invitation while one is pending.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <WvButton type="button" variant="ghost" size="sm" onClick={onClose} disabled={sending}>
            Cancel
          </WvButton>
          <WvButton type="button" variant="primary" size="sm" onClick={onConfirm} disabled={sending}>
            {sending ? "Sending…" : "Send Invitation"}
          </WvButton>
        </div>
      </div>
    </div>
  );
}
