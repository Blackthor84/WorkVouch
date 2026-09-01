/**
 * Accept / decline coworker vouch invites by token (server-only).
 * Backed by public.invites via publicCoworkerVouch + refreshCoworkerVouchStats.
 */

import {
  respondToPublicCoworkerInvite,
  sanitizeInviteToken,
  type RespondResult,
} from "@/lib/invites/publicCoworkerVouch";

export type { RespondResult };

/** Pending invite → accepted; refreshes sender vouch stats + optional notification. */
export async function acceptInvite(rawToken: string): Promise<RespondResult> {
  const token = sanitizeInviteToken(rawToken);
  if (!token) return { ok: false, error: "invalid" };
  return respondToPublicCoworkerInvite(token, "yes");
}

/** Pending invite → declined (no vouch count change). */
export async function declineInvite(rawToken: string): Promise<RespondResult> {
  const token = sanitizeInviteToken(rawToken);
  if (!token) return { ok: false, error: "invalid" };
  return respondToPublicCoworkerInvite(token, "no");
}
