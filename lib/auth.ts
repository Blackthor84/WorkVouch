import { supabaseServer } from "./supabase/server";

export interface User {
  id: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  professional_summary: string | null;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

/**
 * Get current authenticated user from Supabase session.
 * Returns null if session missing or profile is soft-deleted (deleted_at set).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const supabaseAny = supabase as any;
  const { data: row } = await supabaseAny
    .from("profiles")
    .select("deleted_at")
    .eq("id", session.user.id)
    .single();
  if (row?.deleted_at) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
  };
}

/**
 * Get current user profile from Supabase
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select(
      "id, full_name, email, role, industry, city, state, profile_photo_url, professional_summary, visibility, created_at, updated_at"
    )
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;
  return profile as UserProfile;
}

/**
 * Get current user roles from user_roles table
 */
export async function getCurrentUserRoles(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { data: roles } = await supabaseAny
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (!roles || roles.length === 0) return [];
  return (roles as any[]).map((r: any) => r.role);
}

export async function hasRole(role: string): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes(role);
}

export async function isEmployer(): Promise<boolean> {
  return hasRole("employer");
}

export async function isAdmin(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes("admin") || roles.includes("superadmin");
}

export async function isSuperAdmin(): Promise<boolean> {
  return hasRole("superadmin");
}

export async function hasRoleOrSuperadmin(role: string): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes("superadmin") || roles.includes(role);
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getCurrentUserProfile();
  if (profile?.role) return profile.role;
  const roles = await getCurrentUserRoles();
  return roles[0] ?? null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(role: string): Promise<void> {
  const hasAccess = await hasRoleOrSuperadmin(role);
  if (!hasAccess) throw new Error(`Unauthorized: ${role} role required`);
}

export async function hashPassword(password: string): Promise<string> {
  throw new Error(
    "hashPassword is not implemented. Use Supabase Auth signup instead."
  );
}
