/**
 * Require admin for sandbox-v2 API routes. Uses NextAuth + profiles/user_roles.
 */

import { getCurrentUser, getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export async function requireSandboxV2Admin(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const [profile, roles] = await Promise.all([getCurrentUserProfile(), getCurrentUserRoles()]);
  const admin = isAdmin(profile?.role ?? null) || roles.some((r) => isAdmin(r));
  if (!admin) throw new Error("Forbidden: admin or superadmin required");
  return { id: user.id };
}
