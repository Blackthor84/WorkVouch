import { redirect } from "next/navigation";
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

export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await supabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  const profileRole = (profile as { role?: string }).role ?? "";
  if (!["admin", "superadmin"].includes(profileRole)) {
    redirect("/unauthorized");
  }

  const role = profileRole;
  const isSuperAdminRole = role === "superadmin";

  return {
    session,
    user: session.user,
    profile: profile as AdminSession["profile"],
    supabase,
    userId: session.user.id,
    role,
    isSuperAdmin: isSuperAdminRole,
  };
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  const admin = await requireAdmin();
  if (admin.profile.role !== "superadmin") {
    redirect("/unauthorized");
  }
  return admin;
}

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

export async function requireRole(allowedRoles: string[]): Promise<AdminSession> {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const roles = await getSessionRoles(session.user.id);
  const hasRole = allowedRoles.some((r) => roles.includes(r));
  if (!hasRole) {
    redirect("/unauthorized");
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error || !profile) {
    redirect("/login");
  }
  const profileAny = profile as { role?: string };
  const role = roles.includes("superadmin")
    ? "superadmin"
    : roles.includes("admin")
      ? "admin"
      : profileAny.role ?? roles[0] ?? "user";
  return {
    session,
    user: session.user,
    profile: profile as AdminSession["profile"],
    supabase,
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
