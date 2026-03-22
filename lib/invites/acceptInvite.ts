/**
 * Accept / decline coworker vouch invites by token (server-only).
 *
 * Your sketch used `invites` + `users.vouch_count++`. WorkVouch instead:
 * - **`coworker_invites`** — column `invite_token` (not `token`), `sender_id` → `profiles.id`
 * - **`admin`** from `@/lib/supabase-admin` in API routes (not the browser `supabase` client)
 * - **`refresh_user_vouch_stats(sender_id)`** — recomputes `profiles.vouch_count`, `vouch_tier`, `vouch_status`
 *   (do not manually `update({ vouch_count: user.vouch_count + 1 })`; tier/status would drift)
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
