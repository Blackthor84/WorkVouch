import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { supabaseServer } from "@/lib/supabase/server";
import { canModifyUser, canAssignRole } from "@/lib/roles";

export type AdminSession = {
  session: any;
  user: any;
  profile: {
    id: string;
    role: string;
    [key: string]: any;
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
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logAdminAuthFailure("requireAdmin", "no-session");
      redirect("/login");
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      logAdminAuthFailure("requireAdmin", "profile-missing");
      redirect("/login");
    }

    const role = admin.isSuperAdmin ? "super_admin" : admin.isAdmin ? "admin" : "user";
    const isSuperAdminRole = admin.isSuperAdmin;

    return {
      session,
      user: session.user,
      profile: profile as AdminSession["profile"],
      supabase,
      userId: session.user.id,
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
  if (!admin.isAdmin) return null;
  try {
    const supabase = await supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (error || !profile) return null;
    const role = admin.isSuperAdmin ? "super_admin" : "admin";
    return {
      session,
      user: session.user,
      profile: profile as AdminSession["profile"],
      supabase,
      userId: session.user.id,
      role,
      isSuperAdmin: admin.isSuperAdmin,
    };
  } catch {
    return null;
  }
}

/** API-safe super-admin: returns null instead of redirecting. */
export async function requireSuperAdminForApi(): Promise<AdminSession | null> {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) return null;
  return requireAdminForApi();
}

export async function requireRole(allowedRoles: string[]): Promise<AdminSession> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      logAdminAuthFailure("requireRole", "no-session");
      redirect("/login");
    }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
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
    return {
      session,
      user: session.user,
      profile: profile as AdminSession["profile"],
      supabase,
      userId: session.user.id,
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
