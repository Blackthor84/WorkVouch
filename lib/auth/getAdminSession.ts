/**
 * Canonical admin session helper. Uses getUser() + profiles.role.
 * When impersonating: if current user is not admin, checks adminUserId cookie so sandbox-v2 still allows access.
 * NEVER throws — returns null on any failure or non-admin user.
 */

import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";

const ADMIN_USER_ID_COOKIE = "adminUserId";

export type AdminRole = "admin" | "super_admin";

export interface AdminSessionMinimal {
  userId: string;
  /** Authenticated admin user id for audit logging. */
  authUserId: string;
  role: AdminRole;
}

/**
 * Returns { userId, role } if the current user (or adminUserId cookie when impersonating) has admin/super_admin in profiles.role; otherwise null.
 */
export async function getAdminSession(): Promise<AdminSessionMinimal | null> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profile) {
        const rawRole = (profile as { role?: string | null }).role ?? "";
        const role = normalizeRole(rawRole);
        if (isAdminRole(role)) {
          return {
            userId: user.id,
            authUserId: user.id,
            role: role as AdminRole,
          };
        }
      }
    }

    const cookieStore = await cookies();
    const adminUserId = cookieStore.get(ADMIN_USER_ID_COOKIE)?.value?.trim();
    if (adminUserId) {
      const adminSupabase = getSupabaseServer();
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .maybeSingle();
      const rawRole = (profile as { role?: string | null } | null)?.role ?? "";
      const role = normalizeRole(rawRole);
      if (isAdminRole(role)) {
        return {
          userId: adminUserId,
          authUserId: adminUserId,
          role: role as AdminRole,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
