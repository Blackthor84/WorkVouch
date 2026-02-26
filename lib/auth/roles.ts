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

export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}
