/**
 * God Mode state: session-level, cookie-backed.
 * Only SUPERADMIN may enable. Clears on logout (cookie not sent after logout).
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const GODMODE_COOKIE = "workvouch_godmode";
const GODMODE_MAX_AGE = 60 * 60 * 12; // 12 hours

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "godmode-secret"
  );
}

export type GodModeState = {
  enabled: boolean;
  enabledAt?: string;
};

/**
 * Read and verify God Mode cookie. Returns enabled only if JWT is valid and sub === currentUserId and isSuperAdmin.
 */
export async function getGodModeState(
  currentUserId: string,
  isSuperAdmin: boolean
): Promise<GodModeState> {
  if (!currentUserId || !isSuperAdmin) return { enabled: false };
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GODMODE_COOKIE)?.value;
    if (!token) return { enabled: false };
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub as string | undefined;
    if (sub !== currentUserId) return { enabled: false };
    return {
      enabled: payload.enabled === true,
      enabledAt: (payload.enabledAt as string) ?? undefined,
    };
  } catch {
    return { enabled: false };
  }
}

/**
 * Build cookie value for God Mode on. Caller must set on response or use setGodModeCookieOnResponse.
 */
export async function buildGodModeToken(userId: string): Promise<{ token: string; enabledAt: string }> {
  const enabledAt = new Date().toISOString();
  const token = await new SignJWT({ sub: userId, enabled: true, enabledAt })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(GODMODE_MAX_AGE)
    .setIssuedAt()
    .sign(getSecret());
  return { token, enabledAt };
}

export function getGodModeCookieName(): string {
  return GODMODE_COOKIE;
}

export const GODMODE_MAX_AGE_SECONDS = GODMODE_MAX_AGE;
