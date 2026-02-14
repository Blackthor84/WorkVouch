/**
 * Admin impersonation context (session/cookie). No DB for state.
 * PLATFORM_ADMIN only; all actions during impersonation must be audited.
 */

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const IMPERSONATION_COOKIE = "workvouch_impersonation";

export type ImpersonationContext = {
  isImpersonating: boolean;
  userId?: string;
  organizationId?: string;
};

/**
 * Returns current impersonation state from cookie. Never throws.
 */
export async function getImpersonationContext(): Promise<ImpersonationContext> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
    if (!token) return { isImpersonating: false };
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.impersonated_user_id as string | undefined;
    if (!userId) return { isImpersonating: false };
    return { isImpersonating: true, userId };
  } catch {
    return { isImpersonating: false };
  }
}
