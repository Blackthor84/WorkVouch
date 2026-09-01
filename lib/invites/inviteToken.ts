import { nanoid } from "nanoid";

/** URL-safe token for public.invites.token (short links like `/vouch/:token`). */
export function generateInviteToken(size = 16): string {
  return nanoid(size);
}
