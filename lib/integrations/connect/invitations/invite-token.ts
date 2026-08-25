import { createHash, randomBytes } from "crypto";

export const CONNECT_INVITE_EXPIRY_DAYS = 14;

/** Cryptographically secure opaque token — no PII embedded. */
export function generateConnectInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashConnectInviteToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function connectInviteExpiresAt(from = new Date()): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + CONNECT_INVITE_EXPIRY_DAYS);
  return expires.toISOString();
}

export function formatConnectInviteExpiration(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function resolveAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://tryworkvouch.com"
  ).replace(/\/$/, "");
}

export function buildConnectInviteClaimUrl(origin: string, token: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/connect/invite/${encodeURIComponent(token)}`;
}

export function isConnectInviteExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}
