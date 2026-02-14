/**
 * Centralized role checks and hierarchy.
 * Use normalizeRole() for admin/super_admin comparisons. Canonical: "admin" | "super_admin".
 * Enterprise roles: tenant_memberships (enterprise_owner, location_admin, recruiter).
 *
 * Role hierarchy (strict):
 * - user (lowest)
 * - employer
 * - admin
 * - super_admin / superadmin
 * - system (internal only, never assignable via UI)
 */

import { normalizeRole } from "@/lib/auth/normalizeRole";

export type AssignableRole = "user" | "employer" | "admin" | "superadmin";
export type SystemRole = "system";
export type UserRole = AssignableRole | SystemRole;

/** Enterprise tenant roles (from tenant_memberships). */
export type EnterpriseRole = "enterprise_owner" | "location_admin" | "recruiter";

/** Order: lower index = lower privilege. Admin cannot modify anyone at or above their level. */
const ROLE_ORDER: Record<string, number> = {
  user: 0,
  employer: 1,
  admin: 2,
  superadmin: 3,
  super_admin: 3,
  system: 4,
};

export function isAdmin(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "super_admin";
}

export function isSuperAdmin(role?: string | null): boolean {
  return normalizeRole(role) === "super_admin";
}

/** System role is internal only (e.g. background jobs). Not assignable in admin UI. */
export function isSystem(role?: string | null): boolean {
  return role === "system";
}

export function roleLevel(role: string): number {
  const r = normalizeRole(role) || role;
  return ROLE_ORDER[r] ?? ROLE_ORDER[role] ?? -1;
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
    const nr = normalizeRole(newRole);
    if (isSelf && (nr === "admin" || nr === "super_admin")) return false; // cannot escalate own role
    if (nr === "super_admin" || newRole === "system") return false; // cannot assign above self
    return true;
  }
  return false;
}

/** Enterprise role checks (tenant_memberships). */
export function isEnterpriseOwner(role: string): boolean {
  return role === "enterprise_owner";
}

export function isLocationAdmin(role: string): boolean {
  return role === "location_admin";
}

export function isRecruiter(role: string): boolean {
  return role === "recruiter";
}

export function isEnterpriseRole(role: string): boolean {
  return role === "enterprise_owner" || role === "location_admin" || role === "recruiter";
}
