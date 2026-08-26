import Link from "next/link";
import type { ConnectInvitePreview } from "@/lib/integrations/connect/invitations/resolve-connect-invite";
import { WvButton, WvCard, WvShell } from "@/components/wv";
import { WvErrorState } from "@/components/wv/WvErrorState";
import { WvSuccessState } from "@/components/wv/WvSuccessState";
import { formatConnectInviteExpiration } from "@/lib/integrations/connect/invitations/invite-token";

type InviteShellProps = {
  children: React.ReactNode;
};

function InviteShell({ children }: InviteShellProps) {
  return (
    <WvShell>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5 rounded-lg" aria-label="WorkVouch home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg">
            WV
          </span>
          <span className="text-lg font-bold text-wv-foreground">WorkVouch</span>
        </Link>
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </WvShell>
  );
}

export function ConnectInviteInvalidState() {
  return (
    <InviteShell>
      <WvCard glow>
        <WvErrorState
          title="Invitation not found"
          message="This invitation link is invalid. Ask the employer to send a new invitation from their WorkVouch dashboard."
        />
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
            Go to WorkVouch
          </Link>
        </div>
      </WvCard>
    </InviteShell>
  );
}

export function ConnectInviteExpiredState() {
  return (
    <InviteShell>
      <WvCard glow>
        <WvErrorState
          title="Invitation expired"
          message="This invitation has expired. Contact the employer to request a new WorkVouch invitation."
        />
      </WvCard>
    </InviteShell>
  );
}

export function ConnectInviteCancelledState() {
  return (
    <InviteShell>
      <WvCard glow>
        <WvErrorState
          title="Invitation unavailable"
          message="This invitation is no longer active. Contact the employer if you still need access."
        />
      </WvCard>
    </InviteShell>
  );
}

export function ConnectInviteAlreadyClaimedState() {
  return (
    <InviteShell>
      <WvCard glow className="space-y-6">
        <WvErrorState
          title="Invitation already used"
          message="This invitation has already been claimed. Sign in with the account you used to connect your profile."
        />
        <Link href="/login" className="block">
          <WvButton variant="secondary" className="w-full">
            Sign in
          </WvButton>
        </Link>
      </WvCard>
    </InviteShell>
  );
}

export function ConnectInviteEmailMismatchState({ maskedEmail }: { maskedEmail: string }) {
  return (
    <InviteShell>
      <WvCard glow>
        <WvErrorState
          title="Wrong account"
          message={`Sign in with ${maskedEmail} — the email address that received this invitation.`}
        />
      </WvCard>
    </InviteShell>
  );
}

export function ConnectInviteClaimFailureState({ message }: { message: string }) {
  return (
    <InviteShell>
      <WvCard glow>
        <WvErrorState title="Could not connect profile" message={message} />
      </WvCard>
    </InviteShell>
  );
}

type AuthRequiredProps = {
  preview: Extract<ConnectInvitePreview, { ok: true; state: "eligible" }>;
  signInHref: string;
  signUpHref: string;
};

export function ConnectInviteAuthRequiredState({
  preview,
  signInHref,
  signUpHref,
}: AuthRequiredProps) {
  const greeting = preview.candidateName?.trim() || "there";

  return (
    <InviteShell>
      <WvCard glow className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">WorkVouch invitation</p>
          <h1 className="mt-2 text-2xl font-bold text-wv-foreground">
            Hi {greeting}, you&apos;re invited
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-wv-muted">
            <strong className="text-wv-foreground">{preview.employerCompanyName}</strong> invited you to
            claim and connect your WorkVouch profile to your employment application.
          </p>
          <p className="mt-2 text-xs text-wv-muted">
            Expires {formatConnectInviteExpiration(preview.expiresAt)} · sent to {preview.maskedEmail}
          </p>
        </div>

        <div className="rounded-xl border border-wv-border bg-wv-surface/60 px-4 py-3 text-sm text-wv-muted">
          WorkVouch helps you build a verified record of your employment history and professional
          reputation. Create an account or sign in to connect this invitation to your profile.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={signUpHref} className="flex-1">
            <WvButton className="w-full" size="lg">
              Create account
            </WvButton>
          </Link>
          <Link href={signInHref} className="flex-1">
            <WvButton variant="secondary" className="w-full" size="lg">
              Sign in
            </WvButton>
          </Link>
        </div>
      </WvCard>
    </InviteShell>
  );
}

type SuccessProps = {
  employerCompanyName: string;
  candidateName: string | null;
  alreadyConnected: boolean;
};

export function ConnectInviteSuccessState({
  employerCompanyName,
  candidateName,
  alreadyConnected,
}: SuccessProps) {
  const greeting = candidateName?.trim() || "You";

  return (
    <InviteShell>
      <WvCard glow>
        <WvSuccessState
          title={alreadyConnected ? "You're already connected" : "You're connected to WorkVouch"}
          message={
            alreadyConnected
              ? `${greeting}, your WorkVouch profile is already connected to your application with ${employerCompanyName}.`
              : `${greeting}, your WorkVouch profile is now connected to your employment application with ${employerCompanyName}.`
          }
          action={
            <Link href="/dashboard">
              <WvButton size="lg">Continue to WorkVouch</WvButton>
            </Link>
          }
        />
      </WvCard>
    </InviteShell>
  );
}
