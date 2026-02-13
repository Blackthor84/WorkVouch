/**
 * Safe admin context resolution. NEVER throws — returns { authorized: false } on any failure.
 * Use for UI visibility and non-blocking checks. Use requireAdmin() when you need supabase + full profile.
 */

import { getAdminSession } from "@/lib/auth/getAdminSession";

export type AdminContextAuthorized = {
  authorized: true;
  user: { id: string };
  role: "admin" | "superadmin";
  isAdmin: true;
  isSuperAdmin: boolean;
};

export type AdminContextUnauthorized = {
  authorized: false;
  user?: undefined;
  role?: undefined;
  isAdmin: false;
  isSuperAdmin: false;
};

export type AdminContext = AdminContextAuthorized | AdminContextUnauthorized;

/**
 * Resolves current user's admin context. Never throws.
 * Do not assume profile, roles, or session.user.roles — only profiles.role is used.
 */
export async function getAdminContext(): Promise<AdminContext> {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return { authorized: false, isAdmin: false, isSuperAdmin: false };
    }
    return {
      authorized: true,
      user: { id: admin.userId },
      role: admin.role,
      isAdmin: true,
      isSuperAdmin: admin.role === "superadmin",
    };
  } catch {
    return { authorized: false, isAdmin: false, isSuperAdmin: false };
  }
}
