/**
 * Centralized RBAC: roles and permissions for admin and employer.
 * PLATFORM_* = /admin; EMPLOYER_* = /employer.
 */

export const AdminRole = {
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  PLATFORM_READ_ONLY: "PLATFORM_READ_ONLY",
  EMPLOYER_ADMIN: "EMPLOYER_ADMIN",
  EMPLOYER_USER: "EMPLOYER_USER",
} as const;

export type AdminRoleType = (typeof AdminRole)[keyof typeof AdminRole];

export const Permission = {
  VIEW_USERS: "VIEW_USERS",
  EDIT_USERS: "EDIT_USERS",
  VIEW_AUDIT_LOG: "VIEW_AUDIT_LOG",
  MANAGE_ORGANIZATIONS: "MANAGE_ORGANIZATIONS",
  IMPERSONATE_EMPLOYER: "IMPERSONATE_EMPLOYER",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",
  MANAGE_FEATURE_FLAGS: "MANAGE_FEATURE_FLAGS",
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];

const VIEW_ONLY_PERMISSIONS: PermissionType[] = [
  Permission.VIEW_USERS,
  Permission.VIEW_AUDIT_LOG,
  Permission.VIEW_ANALYTICS,
];

const PLATFORM_ADMIN_PERMISSIONS: PermissionType[] = [
  Permission.VIEW_USERS,
  Permission.EDIT_USERS,
  Permission.VIEW_AUDIT_LOG,
  Permission.MANAGE_ORGANIZATIONS,
  Permission.IMPERSONATE_EMPLOYER,
  Permission.VIEW_ANALYTICS,
  Permission.MANAGE_FEATURE_FLAGS,
];

const EMPLOYER_ADMIN_PERMISSIONS: PermissionType[] = [
  Permission.VIEW_USERS,
  Permission.VIEW_AUDIT_LOG,
  Permission.MANAGE_ORGANIZATIONS,
  Permission.VIEW_ANALYTICS,
];

const EMPLOYER_USER_PERMISSIONS: PermissionType[] = [
  Permission.VIEW_USERS,
];

const ROLE_PERMISSIONS: Record<AdminRoleType, PermissionType[]> = {
  [AdminRole.PLATFORM_ADMIN]: PLATFORM_ADMIN_PERMISSIONS,
  [AdminRole.PLATFORM_READ_ONLY]: VIEW_ONLY_PERMISSIONS,
  [AdminRole.EMPLOYER_ADMIN]: EMPLOYER_ADMIN_PERMISSIONS,
  [AdminRole.EMPLOYER_USER]: EMPLOYER_USER_PERMISSIONS,
};

/**
 * Returns true if the role has the permission. Never throws.
 */
export function hasPermission(
  role: AdminRoleType | null | undefined,
  permission: PermissionType
): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  const list = ROLE_PERMISSIONS[role as AdminRoleType];
  return Array.isArray(list) && list.includes(permission);
}

/**
 * Returns true if the role can mutate data (edit users, manage orgs, etc.). Never throws.
 */
export function canMutate(role: AdminRoleType | null | undefined): boolean {
  return (
    hasPermission(role, Permission.EDIT_USERS) ||
    hasPermission(role, Permission.MANAGE_ORGANIZATIONS) ||
    role === AdminRole.PLATFORM_ADMIN
  );
}
