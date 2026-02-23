import { supabaseServer } from "./supabase/server";
import { getSupabaseServer } from "./supabase/admin";
import { getEffectiveUserIdWithAuth } from "./server/effectiveUserId";

export interface User {
  id: string;
  email?: string;
}

export interface EffectiveUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  isImpersonating: boolean;
  deleted_at?: unknown;
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
 * Resolve the effective user (impersonated when cookie is set, otherwise auth user).
 * Use in user-facing API routes instead of direct auth lookups.
 * When impersonating uses service-role client so RLS does not block.
 */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const withAuth = await getEffectiveUserIdWithAuth();
  if (!withAuth) return null;
  const { effectiveUserId, isImpersonating } = withAuth;
  const supabase = isImpersonating ? getSupabaseServer() : (await supabaseServer());
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select("id, user_id, email, full_name, role, deleted_at")
    .or(`id.eq.${effectiveUserId},user_id.eq.${effectiveUserId}`)
    .maybeSingle();
  if (error || !profile) return null;
  const row = profile as { id?: string; user_id?: string; email?: string | null; full_name?: string | null; role?: string | null; deleted_at?: unknown };
  return {
    id: row.user_id ?? row.id ?? effectiveUserId,
    email: row.email ?? null,
    full_name: row.full_name ?? null,
    role: row.role ?? null,
    isImpersonating,
    deleted_at: row.deleted_at,
  };
}

/**
 * Get current authenticated user from Supabase (effective user when impersonating).
 * Returns null if not authenticated or profile is soft-deleted (deleted_at set).
 * Use getEffectiveUser() when you need isImpersonating or profile fields.
 */
export async function getCurrentUser(): Promise<User | null> {
  const effective = await getEffectiveUser();
  if (!effective || effective.deleted_at) return null;
  return {
    id: effective.id,
    email: effective.email ?? undefined,
  };
}

/**
 * Get profile role and onboarding status by user id (server-side).
 * Use when you have userId (e.g. from session) and need only role + onboarding_completed.
 */
export async function getProfile(userId: string): Promise<{
  role: string | null;
  onboarding_completed: boolean;
}> {
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    role: (data?.role as string | null) ?? null,
    onboarding_completed: (data?.onboarding_completed as boolean) ?? false,
  };
}

/**
 * Get current user profile from Supabase.
 * Uses effective user id when impersonating (acting_user), so profile matches who we're acting as.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const { getEffectiveUserId } = await import("@/lib/server/effectiveUserId");
  const effectiveUserId = await getEffectiveUserId();
  if (!effectiveUserId) return null;
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select(
      "id, full_name, email, role, industry, city, state, profile_photo_url, professional_summary, visibility, created_at, updated_at"
    )
    .eq("id", effectiveUserId)
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
