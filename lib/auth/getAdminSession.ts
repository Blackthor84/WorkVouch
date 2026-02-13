/**
 * Canonical admin session helper. Uses Supabase session + profiles.role.
 * NEVER throws — returns null on any failure or non-admin user.
 * Use for guard checks; use requireAdmin() when you need supabase client + full profile.
 */

import { supabaseServer } from "@/lib/supabase/server";

export type AdminRole = "admin" | "superadmin";

export interface AdminSessionMinimal {
  userId: string;
  role: AdminRole;
}

/**
 * Returns { userId, role } if the current user has admin or superadmin role; otherwise null.
 * Does not throw. Roles come from profiles.role only.
 */
export async function getAdminSession(): Promise<AdminSessionMinimal | null> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) return null;

    const role = (profile as { role?: string | null }).role ?? "";
    if (role !== "admin" && role !== "superadmin") return null;

    return {
      userId: session.user.id,
      role: role as AdminRole,
    };
  } catch {
    return null;
  }
}
