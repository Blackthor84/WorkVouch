/**
 * Acting user (impersonated user) for role and routing.
 * Stored in signed JWT cookie "acting_user". When set, effectiveRole = acting_user.role and effectiveUserId = acting_user.id.
 * Auth user remains the real logged-in user (e.g. superadmin). All role checks and route guards use effectiveRole.
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export const ACTING_USER_COOKIE = "acting_user";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour
const JWT_EXPIRY = "1h";

function getSecret() {
  return new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "acting-user-secret"
  );
}

export type ActingUser = { id: string; role: string };

export const IMPERSONATED_USER_ID_COOKIE = "impersonatedUserId";

/**
 * Returns the acting user (id, role) from impersonatedUserId cookie or JWT when valid and auth user is admin/superadmin.
 * effectiveUserId = impersonatedUserId ?? acting_user.id ?? auth_user.id
 */
export async function getActingUser(): Promise<ActingUser | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;
  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  if (!isAdmin) return null;

  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value;
  if (impersonatedUserId?.trim()) {
    return { id: impersonatedUserId.trim(), role: "user" };
  }

  const token = cookieStore.get(ACTING_USER_COOKIE)?.value;
  if (!token?.trim()) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = typeof payload.sub === "string" ? payload.sub : null;
    const role = typeof payload.role === "string" ? payload.role.trim().toLowerCase() : "user";
    if (!id) return null;
    return { id, role };
  } catch {
    return null;
  }
}

/**
 * effectiveUserId = acting_user?.id ?? auth_user.id
 * effectiveRole = acting_user?.role ?? auth_user.role
 * Use for all data queries (effectiveUserId) and route guards/redirects (effectiveRole).
 */
export async function getEffectiveSession(): Promise<{
  authUserId: string;
  authRole: string;
  effectiveUserId: string;
  effectiveRole: string;
  actingUser: ActingUser | null;
  isImpersonating: boolean;
} | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;

  const acting = await getActingUser();
  const authRole = authed.role;

  if (acting) {
    return {
      authUserId: authed.user.id,
      authRole,
      effectiveUserId: acting.id,
      effectiveRole: acting.role,
      actingUser: acting,
      isImpersonating: true,
    };
  }

  return {
    authUserId: authed.user.id,
    authRole,
    effectiveUserId: authed.user.id,
    effectiveRole: authRole,
    actingUser: null,
    isImpersonating: false,
  };
}

/**
 * Create JWT payload for acting user and set HTTP-only cookie.
 * Call from POST /api/admin/impersonate only (after superadmin check).
 */
export async function setActingUserCookie(acting: ActingUser): Promise<void> {
  const secret = getSecret();
  const token = await new SignJWT({ role: acting.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(acting.id)
    .setExpirationTime(JWT_EXPIRY)
    .setIssuedAt()
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(ACTING_USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear acting_user cookie. Call from POST /api/admin/impersonate/exit.
 */
export async function clearActingUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTING_USER_COOKIE, "", { maxAge: 0, path: "/" });
}
