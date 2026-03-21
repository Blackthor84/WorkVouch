/**
 * Single platform super_admin account (profiles.role = super_admin).
 * Override with FOUNDER_EMAIL in env for staging if needed.
 */
export const FOUNDER_EMAIL = (
  process.env.FOUNDER_EMAIL ?? process.env.NEXT_PUBLIC_FOUNDER_EMAIL ?? "founder@tryworkvouch.com"
)
  .trim()
  .toLowerCase();

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === FOUNDER_EMAIL;
}
