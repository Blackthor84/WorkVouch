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
 * Get current authenticated user from Supabase (getUser() for server-side safety).
 * Returns null if not authenticated or profile is soft-deleted (deleted_at set).
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;
  const supabaseAny = supabase as any;
  const { data: row } = await supabaseAny
    .from("profiles")
    .select("deleted_at")
    .eq("id", user.id)
    .single();
  if (row?.deleted_at) return null;
  return {
    id: user.id,
    email: user.email ?? undefined,
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

/** Roles come only from profiles.role. */
export async function hasRole(role: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return (profile?.role ?? "") === role;
}

export async function isEmployer(): Promise<boolean> {
  return hasRole("employer");
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  const r = profile?.role ?? "";
  return r === "admin" || r === "superadmin";
}

export async function isSuperAdmin(): Promise<boolean> {
  return hasRole("superadmin");
}

export async function hasRoleOrSuperadmin(role: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  const r = profile?.role ?? "";
  return r === "superadmin" || r === role;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const profile = await getCurrentUserProfile();
  return profile?.role ?? null;
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
