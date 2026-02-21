/**
 * Server-side effective user for ALL data queries. Production-safe.
 *
 * Resolves: effectiveUserId = impersonated_user_id ?? auth.uid()
 * - Admin flow: cookie "impersonate_user" (plain userId) — superadmin-only; no env kill switch.
 * - Sandbox flow: cookie "sandbox_playground_impersonation" (JSON with id) when SANDBOX_IMPERSONATION_ENABLED=true.
 * - Only admins/superadmins can impersonate.
 * - Exit: POST /api/admin/impersonate/exit clears both cookies.
 * - RLS: use effectiveUserId in all user-scoped queries; RLS remains enabled.
 */

import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

const ADMIN_IMPERSONATION_COOKIE = "impersonate_user";
const SANDBOX_IMPERSONATION_COOKIE = "sandbox_playground_impersonation";

/** When false or unset, sandbox impersonation is disabled (production kill switch). */
function isSandboxImpersonationEnabled(): boolean {
  return process.env.SANDBOX_IMPERSONATION_ENABLED === "true";
}

function getImpersonatedUserIdFromSandboxCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  try {
    const parsed = JSON.parse(cookieValue) as { id?: string };
    const id = parsed?.id;
    return id && typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

/** Returns impersonated user id from admin cookie (plain string) or null. */
function getImpersonatedUserIdFromAdminCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const id = cookieValue.trim();
  return id.length > 0 ? id : null;
}

/**
 * Returns the user id to use for ALL Supabase data queries in this request.
 * effectiveUserId = impersonated_user_id ?? auth.uid()
 * Checks admin cookie first (impersonate_user), then sandbox cookie when enabled.
 * Returns null if not authenticated.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  const cookieStore = await cookies();

  const adminUserId = getImpersonatedUserIdFromAdminCookie(cookieStore.get(ADMIN_IMPERSONATION_COOKIE)?.value);
  if (adminUserId && isAdmin) return adminUserId;

  if (isSandboxImpersonationEnabled()) {
    const raw = cookieStore.get(SANDBOX_IMPERSONATION_COOKIE)?.value;
    const sandboxUserId = getImpersonatedUserIdFromSandboxCookie(raw);
    if (sandboxUserId && isAdmin) return sandboxUserId;
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

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  const cookieStore = await cookies();

  const adminUserId = getImpersonatedUserIdFromAdminCookie(cookieStore.get(ADMIN_IMPERSONATION_COOKIE)?.value);
  if (adminUserId && isAdmin) {
    return {
      effectiveUserId: adminUserId,
      authUserId: authed.user.id,
      isImpersonating: true,
    };
  }

  if (isSandboxImpersonationEnabled()) {
    const raw = cookieStore.get(SANDBOX_IMPERSONATION_COOKIE)?.value;
    const sandboxUserId = getImpersonatedUserIdFromSandboxCookie(raw);
    if (sandboxUserId && isAdmin) {
      return {
        effectiveUserId: sandboxUserId,
        authUserId: authed.user.id,
        isImpersonating: true,
      };
    }
  }

  return {
    effectiveUserId: authed.user.id,
    authUserId: authed.user.id,
    isImpersonating: false,
  };
}
