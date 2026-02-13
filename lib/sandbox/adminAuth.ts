/**
 * Require admin for sandbox-v2 API routes. Uses Supabase + profiles.role.
 */

import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import { isAdmin, isSuperAdmin } from "@/lib/roles";

export async function requireSandboxV2Admin(): Promise<{ id: string }> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const profile = await getCurrentUserProfile();
  const admin = isAdmin(profile?.role ?? null);
  if (!admin) throw new Error("Forbidden: admin or superadmin required");
  return { id: user.id };
}

/** Same as requireSandboxV2Admin but also returns whether user is superadmin (sees all sessions). */
export async function requireSandboxV2AdminWithRole(): Promise<{ id: string; isSuperAdmin: boolean }> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");
  const profile = await getCurrentUserProfile();
  const admin = isAdmin(profile?.role ?? null);
  if (!admin) throw new Error("Forbidden: admin or superadmin required");
  const superAdmin = isSuperAdmin(profile?.role ?? null);
  return { id: user.id, isSuperAdmin: !!superAdmin };
}
