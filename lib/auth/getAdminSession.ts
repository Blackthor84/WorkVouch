/**
 * Canonical admin session helper. Uses getUser() + profiles.role.
 * NEVER throws — returns null on any failure or non-admin user.
 * Use for guard checks; use requireAdmin() when you need supabase client + full profile.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";

export type AdminRole = "admin" | "super_admin";

export interface AdminSessionMinimal {
  userId: string;
  /** Authenticated admin user id for audit logging. */
  authUserId: string;
  role: AdminRole;
}

/**
 * Returns { userId, role } if the current user has admin or super_admin in profiles.role; otherwise null.
 */
export async function getAdminSession(): Promise<AdminSessionMinimal | null> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) return null;

    const rawRole = (profile as { role?: string | null }).role ?? "";
    const role = normalizeRole(rawRole);
    if (!isAdminRole(role)) return null;

    return {
      userId: user.id,
      authUserId: user.id,
      role: role as AdminRole,
    };
  } catch {
    return null;
  }
}
