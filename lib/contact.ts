/**
 * Centralized WorkVouch contact emails (tryworkvouch.com).
 * Use CONTACT_EMAILS in pages and components — do not hardcode email strings.
 *
 * Context:
 * - sales: pricing, employer upgrade, demo requests, enterprise contact
 * - marketing: press, partnerships, media, newsletter
 * - info: general inquiries, footer "General Questions," About page
 * - contact: Contact page primary
 * - legal: Terms, Privacy, compliance, DMCA
 * - support: Help center, password reset, user support, account issues
 */
export const CONTACT_EMAILS = {
  sales: "sales@tryworkvouch.com",
  marketing: "marketing@tryworkvouch.com",
  info: "info@tryworkvouch.com",
  contact: "contact@tryworkvouch.com",
  legal: "legal@tryworkvouch.com",
  support: "support@tryworkvouch.com",
} as const;
