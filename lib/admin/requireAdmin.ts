import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { isAdmin, isSuperAdmin, canModifyUser, canAssignRole } from "@/lib/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminSession = {
  userId: string;
  role: string;
  isSuperAdmin: boolean;
};

/**
 * Require admin or superadmin. Returns session info or throws.
 * Use in API routes: const admin = await requireAdmin();
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const role = roles.includes("superadmin") ? "superadmin" : roles.includes("admin") ? "admin" : null;
  if (!role || !isAdmin(role)) {
    throw new Error("Forbidden");
  }
  return {
    userId: session.user.id,
    role,
    isSuperAdmin: isSuperAdmin(role) || roles.includes("superadmin"),
  };
}

/**
 * Require superadmin only. Use for hard delete, Stripe ID edits, system panel.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (!admin.isSuperAdmin) {
    throw new Error("Forbidden: Superadmin only");
  }
  return admin;
}

/**
 * Enforce: admin cannot modify superadmin; admin cannot escalate own role.
 * Call after requireAdmin() and after fetching target profile.
 * @param admin - from requireAdmin()
 * @param targetUserId - user being modified
 * @param targetRole - target's current role (from profiles or user_roles)
 * @param newRole - if role is being changed, the new role; otherwise undefined
 * @throws if actor may not perform the action
 */
export function assertAdminCanModify(
  admin: AdminSession,
  targetUserId: string,
  targetRole: string,
  newRole?: string
): void {
  if (!canModifyUser(admin.role, targetRole)) {
    throw new Error("Forbidden: Cannot modify a user with equal or higher role");
  }
  if (newRole !== undefined && !canAssignRole(admin.role, newRole, admin.userId === targetUserId)) {
    throw new Error("Forbidden: Cannot assign this role (e.g. cannot escalate own role or assign superadmin)");
  }
}
