// lib/auth/roles.ts

export type Role = "recruiter" | "manager" | "exec" | "admin";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  recruiter: ["read"],
  manager: ["read", "simulate"],
  exec: ["read", "simulate", "mass_simulate", "export"],
  admin: ["*"],
};

export function hasPermission(role: Role, perm: string): boolean {
  if (role === "admin") return true;
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

/**
 * Normalizes unknown / external role strings into a safe internal Role
 * Defaults to "recruiter" (least privilege)
 */
export function normalizeRole(role?: string | null): Role {
  if (role === "admin") return "admin";
  if (role === "exec") return "exec";
  if (role === "manager") return "manager";
  return "recruiter";
}

export function isAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === "admin";
}
