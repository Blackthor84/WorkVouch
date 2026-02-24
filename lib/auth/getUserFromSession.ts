/**
 * Get authenticated user from session for App Router API routes.
 * Uses existing Supabase auth (same as getAuthedUser / layouts). No req.session.
 * Pass the result of await cookies() from next/headers.
 *
 * ⚠️ Do NOT use for admin routes. Use requireAdminSupabase() from @/lib/auth/requireAdminSupabase
 * (Supabase Route Handler auth: supabase.auth.getUser() + role from user_metadata/app_metadata).
 */

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export type UserFromSession = {
  id: string;
  email: string;
  role: string;
};

/**
 * Returns the current user from Supabase session (cookies). Role from app_metadata.role.
 * Use in app/api/** route handlers with: const cookieStore = await cookies(); const user = await getUserFromSession(cookieStore);
 */
export async function getUserFromSession(
  _cookies: ReadonlyRequestCookies
): Promise<UserFromSession | null> {
  const authed = await getAuthedUser();
  if (!authed?.user?.id) return null;
  return {
    id: authed.user.id,
    email: authed.user.email,
    role: authed.role,
  };
}
