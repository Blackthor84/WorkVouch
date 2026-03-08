/**
 * Admin check using ONLY auth metadata (no DB).
 * user.app_metadata.role from getUser(): "user" | "admin" | "superadmin"
 * Use for: nav visibility, admin route guard, API 403.
 */

import { getUser } from "@/lib/auth/getUser";
import type { AdminRole } from "@/lib/auth/admin-role-guards";
import { getRoleFromUser } from "@/lib/auth/admin-role-guards";

export type AdminMetadataResult = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  userId: string | null;
};

/**
 * Returns admin status and role from Supabase user app_metadata only. Never throws.
 */
export async function getAdminFromMetadata(): Promise<AdminMetadataResult> {
  try {
    const user = await getUser();
    if (!user?.id) return { isAdmin: false, isSuperAdmin: false, role: "user", userId: null };
    const userLike = { id: user.id, app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata };
    const role = getRoleFromUser(userLike);
    const isAdmin = role === "admin" || role === "superadmin";
    const isSuperAdmin = role === "superadmin";
    return { isAdmin, isSuperAdmin, role, userId: user.id };
  } catch {
    return { isAdmin: false, isSuperAdmin: false, role: "user", userId: null };
  }
}
