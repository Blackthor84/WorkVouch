import { sendEmail } from "@/lib/utils/sendgrid";
import {
  buildConnectInviteClaimUrl,
  formatConnectInviteExpiration,
} from "./invite-token";

export type DispatchConnectCandidateInviteArgs = {
  to: string;
  candidateFirstName: string;
  employerCompanyName: string;
  claimUrl: string;
  expiresAt: string;
};

export function buildConnectCandidateInviteEmailHtml(
  args: DispatchConnectCandidateInviteArgs
): string {
  const expirationLabel = formatConnectInviteExpiration(args.expiresAt);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <p>Hi ${escapeHtml(args.candidateFirstName)},</p>
      <p><strong>${escapeHtml(args.employerCompanyName)}</strong> invited you to WorkVouch.</p>
      <p>WorkVouch helps workers build a verified record of their employment history and professional reputation.</p>
      <p>You can claim your profile and connect it to your application.</p>
      <p style="margin: 28px 0;">
        <a href="${args.claimUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Claim Your WorkVouch Profile
        </a>
      </p>
      <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${args.claimUrl}</p>
      <p style="color: #6b7280; font-size: 14px;">This invitation expires ${expirationLabel}.</p>
      <p style="color: #6b7280; font-size: 14px;">If you were not expecting this invitation, you can ignore this email.</p>
      <p>Best regards,<br>The WorkVouch Team</p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function dispatchConnectCandidateInviteEmail(
  args: DispatchConnectCandidateInviteArgs
): Promise<{ success: boolean; error?: string }> {
  const html = buildConnectCandidateInviteEmailHtml(args);
  return sendEmail(args.to, "You've been invited to WorkVouch", html);
}

export function firstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

export { buildConnectInviteClaimUrl };
