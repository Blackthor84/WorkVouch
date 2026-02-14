/**
 * Canonical admin session helper. Uses Supabase session + admin_users table.
 * NEVER throws — returns null on any failure or non-admin user.
 * Use for guard checks; use requireAdmin() when you need supabase client + full profile.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";

export type AdminRole = "admin" | "super_admin";

export interface AdminSessionMinimal {
  userId: string;
  role: AdminRole;
}

/**
 * Returns { userId, role } if the current user is in admin_users with role admin or super_admin; otherwise null.
 * Roles come from admin_users table only. Normalizes to "admin" | "super_admin".
 */
export async function getAdminSession(): Promise<AdminSessionMinimal | null> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id || !session?.user?.email) return null;

    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", session.user.email)
      .maybeSingle();

    if (error || !adminRow) return null;

    const rawRole = (adminRow as { role?: string | null }).role ?? "";
    const role = normalizeRole(rawRole);
    if (!isAdminRole(role)) return null;

    return {
      userId: session.user.id,
      role: role as AdminRole,
    };
  } catch {
    return null;
  }
}
