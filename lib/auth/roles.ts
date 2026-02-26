export type Role = "recruiter" | "manager" | "exec" | "admin";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  recruiter: ["read"],
  manager: ["read", "simulate"],
  exec: ["read", "simulate", "mass_simulate", "export"],
  admin: ["*"],
};

export function hasPermission(role: string | null, perm: string): boolean {
  if (!role) return false;
  if (role === "admin" || role === "superadmin") return true;
  const normalized = role.toLowerCase() as Role;
  const perms = ROLE_PERMISSIONS[normalized];
  if (perms?.includes("*")) return true;
  return perms?.includes(perm) ?? false;
}
