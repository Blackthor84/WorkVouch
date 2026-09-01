import {
  createDraftInvite,
  deleteUnsentInvitesForSender,
  displayNameFromContactValue,
  findInvitesForSender,
  inviteWasSent,
  ACTIVE_ONBOARDING_STATUSES,
  type CoworkerVouchInvite,
} from "@/lib/invites/coworkerVouchInviteStore";
import type { PostgrestErrorLike } from "@/lib/supabase/postgrestErrors";

export type OnboardingContactInput = {
  position: number;
  display_name: string;
  email: string | null;
  phone: string | null;
};

export type OnboardingContactRecord = {
  id: string;
  position: number;
  display_name: string;
  email: string | null;
  phone: string | null;
  coworker_invite_id: string | null;
  inviteSent: boolean;
  storage: "invites";
};

type MutateResult = { data: unknown; error: PostgrestErrorLike };

const ACTIVE_ONBOARDING_STATUSES_LIST = [...ACTIVE_ONBOARDING_STATUSES] as const;

function inviteToContactRecord(invite: CoworkerVouchInvite, position: number): OnboardingContactRecord {
  const sent = inviteWasSent(invite.status);
  return {
    id: invite.id,
    position,
    display_name: displayNameFromContactValue(invite.contact),
    email: invite.email,
    phone: invite.phone,
    coworker_invite_id: sent ? invite.id : null,
    inviteSent: sent,
    storage: "invites",
  };
}

export async function loadOnboardingContacts(userId: string): Promise<{
  contacts: OnboardingContactRecord[];
  error: PostgrestErrorLike;
}> {
  const { invites, error } = await findInvitesForSender(userId, {
    statuses: [...ACTIVE_ONBOARDING_STATUSES_LIST],
    limit: 2,
  });

  if (error) {
    return { contacts: [], error };
  }

  return {
    contacts: invites.map((row, index) => inviteToContactRecord(row, index + 1)),
    error: null,
  };
}

export async function saveOnboardingContacts(
  userId: string,
  contacts: OnboardingContactInput[],
  job: { id: string; company_name: string } | null
): Promise<{ ok: true; count: number; storage: "invites" } | { ok: false; error: string }> {
  if (!job?.id) {
    return { ok: false, error: "Add a job before saving coworkers" };
  }

  const delErr = await deleteUnsentInvitesForSender(userId);
  if (delErr) {
    return { ok: false, error: delErr.message ?? "Could not replace saved coworkers" };
  }

  let saved = 0;
  for (const contact of contacts) {
    if (!contact.email && !contact.phone) {
      return { ok: false, error: "Email or phone required for each coworker" };
    }

    const { invite, error } = await createDraftInvite({
      senderId: userId,
      jobId: job.id,
      email: contact.email,
      phone: contact.phone,
    });

    if (error) {
      const message = String(error.message ?? "");
      if (!contact.email && contact.phone && message.toLowerCase().includes("email")) {
        return {
          ok: false,
          error: "This environment requires an email address for each coworker. Add an email to continue.",
        };
      }
      return { ok: false, error: message || "Could not save coworker" };
    }

    if (!invite?.id) {
      return { ok: false, error: "Could not save coworker" };
    }

    saved += 1;
  }

  if (saved < 1) {
    return { ok: false, error: "Could not save coworkers" };
  }

  console.log("onboarding contacts: saved public.invites pending rows", { userId, count: saved });

  return { ok: true, count: saved, storage: "invites" };
}

export async function countOnboardingContacts(userId: string): Promise<{
  count: number;
  error: PostgrestErrorLike;
}> {
  const { invites, error } = await findInvitesForSender(userId, {
    statuses: [...ACTIVE_ONBOARDING_STATUSES_LIST, "accepted"],
  });

  if (error) {
    return { count: 0, error };
  }

  return { count: invites.length, error: null };
}

export async function linkContactToInvite(
  _contact: OnboardingContactRecord,
  _inviteId: string
): Promise<MutateResult> {
  return { data: null, error: null };
}
