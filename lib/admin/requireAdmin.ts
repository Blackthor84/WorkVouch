import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin, isSuperAdmin, canModifyUser, canAssignRole } from "@/lib/roles";

export type AdminSession = {
  userId: string;
  role: string;
  isSuperAdmin: boolean;
};

async function getSessionRoles(userId: string): Promise<string[]> {
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { data: profile } = await supabaseAny
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const { data: roleRows } = await supabaseAny
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const fromProfile = (profile as { role?: string } | null)?.role;
  const fromTable = (roleRows as { role: string }[] | null)?.map((r) => r.role) ?? [];
  const roles = fromProfile ? [fromProfile, ...fromTable] : fromTable;
  return [...new Set(roles)].filter(Boolean);
}

/**
 * Require admin or superadmin. Returns session info or throws.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const roles = await getSessionRoles(session.user.id);
  const role = roles.includes("superadmin")
    ? "superadmin"
    : roles.includes("admin")
      ? "admin"
      : null;
  if (!role || !isAdmin(role)) {
    throw new Error("Forbidden");
  }
  return {
    userId: session.user.id,
    role,
    isSuperAdmin: isSuperAdmin(role) || roles.includes("superadmin"),
  };
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (!admin.isSuperAdmin) {
    throw new Error("Forbidden: Superadmin only");
  }
  return admin;
}

export async function requireRole(allowedRoles: string[]): Promise<AdminSession> {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const roles = await getSessionRoles(session.user.id);
  const hasRole = allowedRoles.some((r) => roles.includes(r));
  if (!hasRole) {
    throw new Error("Forbidden");
  }
  const role = roles.includes("superadmin")
    ? "superadmin"
    : roles.includes("admin")
      ? "admin"
      : roles[0] ?? "user";
  return {
    userId: session.user.id,
    role,
    isSuperAdmin: roles.includes("superadmin"),
  };
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
