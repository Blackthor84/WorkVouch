/**
 * Admin and superadmin access guards. BACKEND ENFORCEMENT ONLY.
 * - Page/layout: requireAdmin() / requireSuperAdmin() redirect to /unauthorized if not allowed.
 * - API routes: use requireAdminForApi() / requireSuperAdminForApi(); if null, return adminForbiddenResponse() (403).
 * Never rely on UI-only checks. Fail closed: deny by default.
 */
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { isGodMode } from "@/lib/auth/isGodMode";
import { supabaseServer } from "@/lib/supabase/server";
import { canModifyUser, canAssignRole } from "@/lib/roles";
import { recordFailedAdminAccess } from "@/lib/admin/adminAlertsStore";
import type { AdminContext } from "@/lib/admin/getAdminContext";

function adminOrGodMode(admin: AdminContext): boolean {
  return admin.isAdmin || admin.godMode.enabled;
}

export type AdminSession = {
  session: { user: { id: string; email?: string; [key: string]: unknown } };
  user: { id: string; email?: string; [key: string]: unknown };
  profile: {
    id: string;
    role: string;
    [key: string]: unknown;
  };
  supabase: Awaited<ReturnType<typeof supabaseServer>>;
  userId: string;
  role: string;
  isSuperAdmin: boolean;
};

/** Server-side only. Do not expose to client. */
function logAdminAuthFailure(context: string, reason: string): void {
  try {
    if (typeof process !== "undefined" && process.env?.NODE_ENV !== "test") {
      console.warn(`[admin-auth] ${context}: ${reason}`);
    }
  } catch {
    // no-op
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdminContext();
  if (!admin.isAdmin) {
    logAdminAuthFailure("requireAdmin", "no-admin-context");
    redirect("/unauthorized");
  }

  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      logAdminAuthFailure("requireAdmin", "no-user");
      redirect("/login");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      logAdminAuthFailure("requireAdmin", "profile-missing");
      redirect("/login");
    }

    const role = admin.isSuperAdmin ? "super_admin" : admin.isAdmin ? "admin" : "user";
    const isSuperAdminRole = admin.isSuperAdmin;
    const sessionLike = { user: { ...user, id: user.id, email: user.email } };

    return {
      session: sessionLike,
      user: { ...user, id: user.id, email: user.email },
      profile: profile as AdminSession["profile"],
      supabase,
      userId: user.id,
      role,
      isSuperAdmin: isSuperAdminRole,
    };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      throw e;
    }
    logAdminAuthFailure("requireAdmin", "error");
    redirect("/unauthorized");
  }
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) {
    logAdminAuthFailure("requireSuperAdmin", "not-super-admin");
    redirect("/unauthorized");
  }
  return requireAdmin();
}

/** API-safe: returns null instead of redirecting. Use with adminForbiddenResponse(). */
export async function requireAdminForApi(): Promise<AdminSession | null> {
  const admin = await getAdminContext();
  if (!adminOrGodMode(admin)) {
    recordFailedAdminAccess(admin.email ?? undefined);
    return null;
  }
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error || !profile) return null;
    const role = admin.isSuperAdmin ? "super_admin" : "admin";
    const sessionLike = { user: { ...user, id: user.id, email: user.email } };
    return {
      session: sessionLike,
      user: { ...user, id: user.id, email: user.email },
      profile: profile as AdminSession["profile"],
      supabase,
      userId: user.id,
      role,
      isSuperAdmin: admin.isSuperAdmin,
    };
  } catch {
    return null;
  }
}

/**
 * API-safe superadmin guard: returns null if not superadmin.
 * Use for: promote/demote, silence CRITICAL alerts, system settings. Return 403 when null.
 */
export async function requireSuperAdminForApi(): Promise<AdminSession | null> {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) return null;
  return requireAdminForApi();
}

const FINANCE_OR_BOARD_ROLES = ["finance", "board"] as const;

/** API-safe guard: returns session if profile.role is finance, board, or admin/super_admin. Use for financials, forecast, health APIs. */
export async function requireFinanceForApi(): Promise<AdminSession | null> {
  const admin = await getAdminContext();
  if (adminOrGodMode(admin)) return requireAdminForApi();
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error || !profile) return null;
    const profileRole = String((profile as { role?: string }).role ?? "").toLowerCase();
    if (!FINANCE_OR_BOARD_ROLES.includes(profileRole as typeof FINANCE_OR_BOARD_ROLES[number])) return null;
    const sessionLike = { user: { ...user, id: user.id, email: user.email } };
    return {
      session: sessionLike,
      user: { ...user, id: user.id, email: user.email },
      profile: profile as AdminSession["profile"],
      supabase,
      userId: user.id,
      role: profileRole,
      isSuperAdmin: false,
    };
  } catch {
    return null;
  }
}

/** API-safe board guard: returns session if profile.role is board or admin/super_admin. Use for board dashboard only. */
export async function requireBoardForApi(): Promise<AdminSession | null> {
  const admin = await getAdminContext();
  if (adminOrGodMode(admin)) return requireAdminForApi();
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (error || !profile) return null;
    const profileRole = String((profile as { role?: string }).role ?? "").toLowerCase();
    if (profileRole !== "board") return null;
    const sessionLike = { user: { ...user, id: user.id, email: user.email } };
    return {
      session: sessionLike,
      user: { ...user, id: user.id, email: user.email },
      profile: profile as AdminSession["profile"],
      supabase,
      userId: user.id,
      role: "board",
      isSuperAdmin: false,
    };
  } catch {
    return null;
  }
}

export async function requireRole(allowedRoles: string[]): Promise<AdminSession> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      logAdminAuthFailure("requireRole", "no-user");
      redirect("/login");
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (error || !profile) {
      logAdminAuthFailure("requireRole", "profile-missing");
      redirect("/login");
    }
    const profileRole = (profile as { role?: string }).role ?? "";
    const hasRole = allowedRoles.includes(profileRole);
    if (!hasRole) {
      logAdminAuthFailure("requireRole", "insufficient-role");
      redirect("/unauthorized");
    }
    const role = profileRole === "super_admin" || profileRole === "superadmin" ? "super_admin" : profileRole;
    const isSuperAdminRole = role === "super_admin";
    const sessionLike = { user: { ...user, id: user.id, email: user.email } };
    return {
      session: sessionLike,
      user: { ...user, id: user.id, email: user.email },
      profile: profile as AdminSession["profile"],
      supabase,
      userId: user.id,
      role,
      isSuperAdmin: isSuperAdminRole,
    };
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: string }).digest === "string") {
      throw e;
    }
    logAdminAuthFailure("requireRole", "error");
    redirect("/unauthorized");
  }
}

export function assertAdminCanModify(
  admin: AdminSession,
  targetUserId: string,
  targetRole: string,
  newRole?: string
): void {
  if (!canModifyUser(admin.role, targetRole)) {
    throw new Error("Forbidden: Cannot modify a user with equal or higher role");
  }
  if (
    newRole !== undefined &&
    !canAssignRole(admin.role, newRole, admin.userId === targetUserId)
  ) {
    throw new Error(
      "Forbidden: Cannot assign this role (e.g. cannot escalate own role or assign superadmin)"
    );
  }
}
