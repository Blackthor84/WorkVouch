/**
 * Require admin for sandbox-v2 API routes. Uses admin_users table only.
 * super_admin bypasses sandbox restrictions; sandbox mode flag does NOT block super_admin.
 */

import { getAdminSession } from "@/lib/auth/getAdminSession";

export async function requireSandboxV2Admin(): Promise<{ id: string }> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("Forbidden: admin or super_admin required");
  return { id: admin.authUserId };
}

/** Same as requireSandboxV2Admin but also returns whether user is super_admin (sees all sessions). */
export async function requireSandboxV2AdminWithRole(): Promise<{ id: string; isSuperAdmin: boolean }> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("Forbidden: admin or super_admin required");
  return { id: admin.authUserId, isSuperAdmin: admin.role === "super_admin" };
}
