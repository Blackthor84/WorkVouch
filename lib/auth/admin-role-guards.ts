/**
 * Global role guards. Source of truth: Supabase Auth auth.users.raw_app_meta_data.role.
 * Exposed in session as session.user.app_metadata.role.
 *
 * WHY: Admin access is NEVER UI-only. Every guard must be enforced server-side.
 * WHY 403: Never redirect from API/layout guards; return 403 so clients can handle.
 * WHY no throw: Fail safe; return response object instead of throwing.
 */

import { NextResponse } from "next/server";

export type AdminRole = "user" | "admin" | "superadmin";

export type SessionLike = {
  user?: {
    id?: string;
    email?: string;
    app_metadata?: { role?: string };
  } | null;
};

/**
 * Normalize role from app_metadata. Allowed: user, admin, superadmin.
 */
export function getRoleFromSession(session: SessionLike | null): AdminRole {
  if (!session?.user?.app_metadata?.role) return "user";
  const r = String(session.user.app_metadata.role).toLowerCase().trim();
  if (r === "superadmin" || r === "super_admin") return "superadmin";
  if (r === "admin") return "admin";
  return "user";
}

/**
 * Require admin (admin or superadmin). Returns 403 Response if not allowed; null if allowed.
 * Use in API routes and server logic. NEVER rely on UI-only checks.
 */
export function requireAdmin(session: SessionLike | null): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = getRoleFromSession(session);
  if (role !== "admin" && role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Require superadmin. Returns 403 Response if not superadmin; null if allowed.
 * Use for: promote/demote admins, emergency shutdown, system settings.
 */
export function requireSuperAdmin(session: SessionLike | null): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = getRoleFromSession(session);
  if (role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Check if target is self (admin cannot modify own role).
 */
export function isSelf(adminUserId: string, targetUserId: string): boolean {
  return adminUserId === targetUserId;
}

/**
 * Check if target role is superadmin (admins cannot affect superadmins).
 */
export function isSuperAdminRole(role: string): boolean {
  const r = role.toLowerCase();
  return r === "superadmin" || r === "super_admin";
}

/**
 * Get session-like from Supabase and run requireAdmin. For use in API routes.
 * Returns 403 Response if not admin, or null if allowed (caller gets user from getAdminContext or getUser).
 */
export async function requireAdminFromSupabase(): Promise<NextResponse | null> {
  const { supabaseServer } = await import("@/lib/supabase/server");
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const session: SessionLike = user
    ? { user: { id: user.id, email: user.email, app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata } }
    : { user: null };
  return requireAdmin(session);
}

/**
 * Get session-like from Supabase and run requireSuperAdmin. For use in API routes.
 */
export async function requireSuperAdminFromSupabase(): Promise<NextResponse | null> {
  const { supabaseServer } = await import("@/lib/supabase/server");
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const session: SessionLike = user
    ? { user: { id: user.id, email: user.email, app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata } }
    : { user: null };
  return requireSuperAdmin(session);
}
