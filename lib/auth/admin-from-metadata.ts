/**
 * Admin check using ONLY auth metadata (no DB).
 * session.user.app_metadata.role: "user" | "admin" | "superadmin"
 * Use for: nav visibility, admin route guard, API 403.
 */

import { supabaseServer } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/auth/admin-role-guards";
import { getRoleFromSession } from "@/lib/auth/admin-role-guards";

export type AdminMetadataResult = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  userId: string | null;
};

/**
 * Returns admin status and role from Supabase user app_metadata only. Never throws.
 */
export async function getAdminFromMetadata(): Promise<AdminMetadataResult> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { isAdmin: false, isSuperAdmin: false, role: "user", userId: null };
    const sessionLike = { user: { id: user.id, app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata } };
    const role = getRoleFromSession(sessionLike);
    const isAdmin = role === "admin" || role === "superadmin";
    const isSuperAdmin = role === "superadmin";
    return { isAdmin, isSuperAdmin, role, userId: user.id };
  } catch {
    return { isAdmin: false, isSuperAdmin: false, role: "user", userId: null };
  }
}
