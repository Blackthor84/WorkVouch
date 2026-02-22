/**
 * Server-side effective user for ALL data queries. Production-safe.
 *
 * Resolves: effectiveUserId = acting_user?.id ?? auth.uid(), effectiveRole = acting_user?.role ?? auth.role
 * - Admin flow: JWT cookie "acting_user" (id + role) — superadmin-only; drives role and routing.
 * - Sandbox flow: cookie "sandbox_playground_impersonation" (JSON with id) when SANDBOX_IMPERSONATION_ENABLED=true.
 * - Exit: POST /api/admin/impersonate/exit clears acting_user.
 * - RLS: use effectiveUserId in all user-scoped queries; RLS remains enabled.
 */

import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getActingUser } from "@/lib/auth/actingUser";

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

const IMPERSONATED_USER_ID_COOKIE = "impersonatedUserId";

/**
 * Returns the user id to use for ALL Supabase data queries in this request.
 * effectiveUserId = impersonatedUserId ?? acting_user?.id ?? sandbox_impersonation_id ?? auth.uid()
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;

  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value;
  if (impersonatedUserId?.trim() && (authed.role === "admin" || authed.role === "superadmin")) {
    return impersonatedUserId.trim();
  }

  const acting = await getActingUser();
  if (acting) return acting.id;

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  if (isSandboxImpersonationEnabled()) {
    const cookieStore = await cookies();
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

  const cookieStore = await cookies();
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value;
  if (impersonatedUserId?.trim() && (authed.role === "admin" || authed.role === "superadmin")) {
    return {
      effectiveUserId: impersonatedUserId.trim(),
      authUserId: authed.user.id,
      isImpersonating: true,
    };
  }

  const acting = await getActingUser();
  if (acting) {
    return {
      effectiveUserId: acting.id,
      authUserId: authed.user.id,
      isImpersonating: true,
    };
  }

  const isAdmin = authed.role === "admin" || authed.role === "superadmin";
  if (isSandboxImpersonationEnabled()) {
    const cookieStore = await cookies();
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
