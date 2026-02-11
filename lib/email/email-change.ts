/**
 * Enterprise email change: verification (to new email) and alert (to old email).
 * Uses SendGrid via lib/utils/sendgrid.
 */

import { sendEmail } from "@/lib/utils/sendgrid";

const APP_URL =
  (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL)
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://app.tryworkvouch.com";

/**
 * Send verification link to NEW email (confirm ownership).
 */
export async function sendEmailChangeVerificationEmail(
  toNewEmail: string,
  confirmLink: string,
  expiresInHours: number
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Confirm your new email address</h1>
      <p>You requested to change your WorkVouch account email to this address.</p>
      <p>Click the button below to confirm. This link expires in ${expiresInHours} hours.</p>
      <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Confirm email change</a>
      <p>Or copy and paste this link:</p>
      <p style="word-break: break-all; color: #666;">${confirmLink}</p>
      <p>If you did not request this change, you can safely ignore this email. Your current email will remain in use.</p>
      <p>Best regards,<br>The WorkVouch Team</p>
    </div>
  `;
  const result = await sendEmail(toNewEmail, "Confirm your new WorkVouch email", html);
  return result.success ? { success: true } : { success: false, error: result.error };
}

/**
 * Send alert to OLD email (IP, timestamp, revoke link).
 */
export async function sendEmailChangeAlertToOldEmail(
  toOldEmail: string,
  newEmail: string,
  revokeLink: string,
  ip: string | null,
  userAgent: string | null,
  timestamp: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Your WorkVouch email is being changed</h1>
      <p>A request was made to change your account email from <strong>${toOldEmail}</strong> to <strong>${newEmail}</strong>.</p>
      <p><strong>When:</strong> ${timestamp}</p>
      ${ip ? `<p><strong>IP:</strong> ${ip}</p>` : ""}
      ${userAgent ? `<p><strong>Browser/device:</strong> ${userAgent}</p>` : ""}
      <p>If this wasn't you, click below to revoke the change and keep your current email:</p>
      <a href="${revokeLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Revoke email change</a>
      <p style="word-break: break-all; color: #666;">${revokeLink}</p>
      <p>Best regards,<br>The WorkVouch Team</p>
    </div>
  `;
  const result = await sendEmail(toOldEmail, "WorkVouch: Email change requested", html);
  return result.success ? { success: true } : { success: false, error: result.error };
}

/**
 * Build confirmation URL for the new email (confirm-email-change?token=...).
 */
export function buildConfirmEmailChangeUrl(token: string): string {
  const base = APP_URL.replace(/\/$/, "");
  return `${base}/settings?confirm-email-change=${encodeURIComponent(token)}`;
}

/**
 * Build revoke URL (revoke-email-change?token=...).
 */
export function buildRevokeEmailChangeUrl(token: string): string {
  const base = APP_URL.replace(/\/$/, "");
  return `${base}/settings?revoke-email-change=${encodeURIComponent(token)}`;
}
