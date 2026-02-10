/**
 * Centralized role checks and hierarchy.
 * Source of truth: profiles.role and user_roles table (server-side).
 *
 * Role hierarchy (strict):
 * - user (lowest)
 * - employer
 * - admin
 * - superadmin
 * - system (internal only, never assignable via UI)
 */

export type AssignableRole = "user" | "employer" | "admin" | "superadmin";
export type SystemRole = "system";
export type UserRole = AssignableRole | SystemRole;

/** Order: lower index = lower privilege. Admin cannot modify anyone at or above their level. */
const ROLE_ORDER: Record<string, number> = {
  user: 0,
  employer: 1,
  admin: 2,
  superadmin: 3,
  system: 4,
};

export function isAdmin(role?: string | null): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "superadmin";
}

/** System role is internal only (e.g. background jobs). Not assignable in admin UI. */
export function isSystem(role?: string | null): boolean {
  return role === "system";
}

export function roleLevel(role: string): number {
  return ROLE_ORDER[role] ?? -1;
}

/**
 * Can actor (admin) modify target user?
 * - Admin cannot modify superadmin (or system).
 * - Admin cannot modify another admin if actor is admin (same level).
 * - Superadmin can modify anyone except system.
 */
export function canModifyUser(actorRole: string, targetRole: string): boolean {
  if (isSystem(targetRole)) return false;
  if (isSuperAdmin(actorRole)) return true;
  if (isAdmin(actorRole) && roleLevel(targetRole) >= roleLevel(actorRole)) return false;
  return true;
}

/**
 * Can actor escalate a user to newRole?
 * - Admin cannot escalate own role (targetUserId === actorUserId).
 * - Admin cannot assign superadmin or system.
 * - Superadmin can assign any assignable role.
 */
export function canAssignRole(actorRole: string, newRole: string, isSelf: boolean): boolean {
  if (isSystem(newRole)) return false;
  if (isSuperAdmin(actorRole)) return true;
  if (isAdmin(actorRole)) {
    if (isSelf && (newRole === "admin" || newRole === "superadmin")) return false; // cannot escalate own role
    if (newRole === "superadmin" || newRole === "system") return false; // cannot assign above self
    return true;
  }
  return false;
}
