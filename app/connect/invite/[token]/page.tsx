import type { Metadata } from "next";
import { getUser } from "@/lib/auth/getUser";
import { buildConnectInviteReturnPath } from "@/lib/auth/safeReturnTo";
import { claimConnectCandidateInvite } from "@/lib/employer/candidates/candidate-invite-service";
import {
  inviteEmailsMatch,
  loadConnectInviteCandidateEmail,
  resolveConnectCandidateInvitePreview,
  sanitizeConnectInviteToken,
} from "@/lib/integrations/connect/invitations/resolve-connect-invite";
import {
  ConnectInviteAlreadyClaimedState,
  ConnectInviteAuthRequiredState,
  ConnectInviteCancelledState,
  ConnectInviteClaimFailureState,
  ConnectInviteEmailMismatchState,
  ConnectInviteExpiredState,
  ConnectInviteInvalidState,
  ConnectInviteSuccessState,
} from "@/components/connect/ConnectInviteClaimViews";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token: raw } = await params;
  const token = sanitizeConnectInviteToken(raw);
  if (!token) {
    return { title: "Invitation | WorkVouch" };
  }

  const preview = await resolveConnectCandidateInvitePreview(token);
  if (!preview.ok) {
    return { title: "Invitation | WorkVouch" };
  }

  const name = preview.candidateName?.trim();
  return {
    title: name ? `${name}, you're invited | WorkVouch` : "You're invited | WorkVouch",
    description: `${preview.employerCompanyName} invited you to connect your WorkVouch profile.`,
  };
}

export default async function ConnectInviteClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: raw } = await params;
  const token = sanitizeConnectInviteToken(raw);
  if (!token) {
    return <ConnectInviteInvalidState />;
  }

  const user = await getUser();
  const preview = await resolveConnectCandidateInvitePreview(token, {
    profileId: user?.id ?? null,
  });

  if (!preview.ok) {
    if (preview.state === "expired") return <ConnectInviteExpiredState />;
    if (preview.state === "cancelled") return <ConnectInviteCancelledState />;
    return <ConnectInviteInvalidState />;
  }

  const returnPath = buildConnectInviteReturnPath(token);
  const signInHref = `/login?returnTo=${encodeURIComponent(returnPath)}`;
  const inviteEmail = preview.state === "eligible" ? await loadConnectInviteCandidateEmail(token) : null;
  const signUpHref = `/signup?returnTo=${encodeURIComponent(returnPath)}${
    inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""
  }`;

  if (preview.state === "claimed" || preview.state === "already_connected") {
    if (preview.claimedByCurrentUser) {
      return (
        <ConnectInviteSuccessState
          employerCompanyName={preview.employerCompanyName}
          candidateName={preview.candidateName}
          alreadyConnected
        />
      );
    }
    return <ConnectInviteAlreadyClaimedState />;
  }

  if (!user?.id || !user.email) {
    return (
      <ConnectInviteAuthRequiredState
        preview={preview}
        signInHref={signInHref}
        signUpHref={signUpHref}
      />
    );
  }

  if (!inviteEmail || !inviteEmailsMatch(inviteEmail, user.email)) {
    return <ConnectInviteEmailMismatchState maskedEmail={preview.maskedEmail} />;
  }

  const claimResult = await claimConnectCandidateInvite(token, user.id);
  if (!claimResult.ok) {
    if (claimResult.code === "already_claimed") {
      return <ConnectInviteAlreadyClaimedState />;
    }
    if (claimResult.code === "expired") {
      return <ConnectInviteExpiredState />;
    }
    return <ConnectInviteClaimFailureState message={claimResult.error} />;
  }

  return (
    <ConnectInviteSuccessState
      employerCompanyName={preview.employerCompanyName}
      candidateName={preview.candidateName}
      alreadyConnected={claimResult.alreadyClaimed ?? false}
    />
  );
}
