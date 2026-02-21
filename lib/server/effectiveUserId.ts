/**
 * Server-side effective user for ALL data queries. Production-safe.
 *
 * Resolves: effectiveUserId = impersonated_user_id ?? auth.uid()
 * - Impersonated user id is stored in HTTP-only cookie (sandbox_playground_impersonation).
 * - Only admins/superadmins can impersonate; target must be a worker (no impersonating admins).
 * - Production kill switch: set SANDBOX_IMPERSONATION_ENABLED=true to allow impersonation; otherwise ignored.
 * - Exit: POST /api/sandbox/impersonate/exit. Cookie cleared on logout (client calls exit before signOut).
 * - RLS: use effectiveUserId in all user-scoped queries; RLS remains enabled.
 */

import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

const IMPERSONATION_COOKIE = "sandbox_playground_impersonation";

/** When false or unset, impersonation is disabled (production kill switch). */
function isImpersonationEnabled(): boolean {
  return process.env.SANDBOX_IMPERSONATION_ENABLED === "true";
}

function getImpersonatedUserIdFromCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  try {
    const parsed = JSON.parse(cookieValue) as { id?: string };
    const id = parsed?.id;
    return id && typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/**
 * Returns the user id to use for ALL Supabase data queries in this request.
 * effectiveUserId = impersonated_user_id ?? auth.uid()
 * Impersonation only when: SANDBOX_IMPERSONATION_ENABLED=true, user is admin/superadmin, and cookie is set.
 * Returns null if not authenticated.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;

  if (!isImpersonationEnabled()) {
    return authed.user.id;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  const impersonatedUserId = getImpersonatedUserIdFromCookie(raw);

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  if (impersonatedUserId && isAdmin) {
    return impersonatedUserId;
  }

  return authed.user.id;
}

/**
 * Returns effective user id and the real auth user id (for audit logging).
 * Use effectiveUserId for all data queries; use authUserId when recording who performed the action.
 */
export async function getEffectiveUserIdWithAuth(): Promise<{
  effectiveUserId: string;
  authUserId: string;
  isImpersonating: boolean;
} | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;

  if (!isImpersonationEnabled()) {
    return {
      effectiveUserId: authed.user.id,
      authUserId: authed.user.id,
      isImpersonating: false,
    };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  const impersonatedUserId = getImpersonatedUserIdFromCookie(raw);

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  const isImpersonating = Boolean(impersonatedUserId && isAdmin);

  return {
    effectiveUserId: isImpersonating ? impersonatedUserId! : authed.user.id,
    authUserId: authed.user.id,
    isImpersonating,
  };
}
