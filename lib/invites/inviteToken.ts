import { nanoid } from "nanoid";

/** URL-safe token for `coworker_invites.invite_token` (short links like `/vouch/:token`). */
export function generateInviteToken(size = 16): string {
  return nanoid(size);
}
