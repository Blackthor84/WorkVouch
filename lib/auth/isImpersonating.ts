import { cookies } from "next/headers";

const IMPERSONATION_COOKIE = "impersonation_session";

/**
 * Returns true when the impersonation_session cookie is present (admin viewing as another user).
 * Use in route guards so admin/super_admin are not forced to /admin and instead follow the impersonated user flow.
 */
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(IMPERSONATION_COOKIE);
}
