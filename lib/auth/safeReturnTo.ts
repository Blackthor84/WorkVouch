import { sanitizeConnectInviteToken } from "@/lib/integrations/connect/invitations/resolve-connect-invite";

/** Allow returning to Connect invitation claim pages after authentication. */
export function isSafeConnectInviteReturnTo(path: string): boolean {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/connect/invite/")) return false;
  if (trimmed.includes("?") || trimmed.includes("//") || trimmed.includes("\\")) return false;

  const tokenPart = trimmed.slice("/connect/invite/".length);
  if (!tokenPart) return false;

  try {
    return sanitizeConnectInviteToken(decodeURIComponent(tokenPart)) !== null;
  } catch {
    return false;
  }
}

export function buildConnectInviteReturnPath(token: string): string {
  return `/connect/invite/${encodeURIComponent(token)}`;
}

/** Supabase emailRedirectTo target — preserves safe Connect invite return paths through verification. */
export function buildAuthCallbackRedirectUrl(
  origin: string,
  returnTo?: string | null
): string {
  const base = origin.replace(/\/$/, "");
  const callback = `${base}/auth/callback`;
  const trimmed = returnTo?.trim() ?? "";
  if (trimmed && isSafeConnectInviteReturnTo(trimmed)) {
    return `${callback}?returnTo=${encodeURIComponent(trimmed)}`;
  }
  return callback;
}

/** Prefer a validated Connect invite return path; otherwise use the default post-auth route. */
export function resolvePostAuthRedirectPath(
  returnTo: string | null | undefined,
  defaultPath: string
): string {
  const trimmed = returnTo?.trim() ?? "";
  if (trimmed && isSafeConnectInviteReturnTo(trimmed)) {
    return trimmed;
  }
  return defaultPath;
}
