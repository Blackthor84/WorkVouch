import { getUser } from "@/lib/auth/getUser";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { createClient } from "./supabase/server";
import { getSupabaseServer } from "./supabase/admin";
import { getEffectiveUserIdWithAuth } from "./server/effectiveUserId";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

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
  const supabase = isImpersonating ? getSupabaseServer() : await createClient();
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select("id, user_id, email, full_name, role, deleted_at")
    .or(`id.eq.${effectiveUserId},user_id.eq.${effectiveUserId}`)
    .maybeSingle();
  if (error || !profile) {
    if (isImpersonating) {
      return {
        id: effectiveUserId,
        email: null,
        full_name: null,
        role: null,
        isImpersonating: true,
        deleted_at: undefined,
      };
    }
    // Signed-in user but no profile row / RLS miss — still allow session-scoped actions (e.g. notifications).
    const authed = await getAuthedUser();
    return {
      id: effectiveUserId,
      email: authed?.user?.email ?? null,
      full_name: null,
      role: null,
      isImpersonating: false,
      deleted_at: undefined,
    };
  }
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
  try {
    const supabase = await createClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", userId)
      .single();
    if (error) return { role: null, onboarding_completed: false };
    const row = data as Record<string, unknown> | null;
    return {
      role: (row?.role != null ? String(row.role) : null) as string | null,
      onboarding_completed: Boolean(row?.onboarding_completed),
    };
  } catch {
    return { role: null, onboarding_completed: false };
  }
}

/**
 * Get current user profile from Supabase.
 * Uses effective user id when impersonating (acting_user), so profile matches who we're acting as.
 * Only selects columns that exist; ignores schema mismatch.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { getEffectiveUserId } = await import("@/lib/server/effectiveUserId");
    const effectiveUserId = await getEffectiveUserId();
    if (!effectiveUserId) return null;
    const supabase = await createClient();
    const supabaseAny = supabase as any;
    const { data: profile, error } = await supabaseAny
      .from("profiles")
      .select(
        "id, full_name, email, role, state, profile_photo_url, professional_summary, visibility, created_at, updated_at"
      )
      .eq("id", effectiveUserId)
      .single();
    if (error || !profile) return null;
    const row = profile as Record<string, unknown>;
    const safe: UserProfile = {
      id: String(row.id ?? effectiveUserId),
      full_name: row.full_name != null ? String(row.full_name) : null,
      email: row.email != null ? String(row.email) : null,
      role: row.role != null ? String(row.role) : null,
      state: row.state != null ? String(row.state) : null,
      profile_photo_url: row.profile_photo_url != null ? String(row.profile_photo_url) : null,
      professional_summary: row.professional_summary != null ? String(row.professional_summary) : null,
      visibility: (row.visibility === "private" ? "private" : "public") as "public" | "private",
      created_at: row.created_at != null ? String(row.created_at) : "",
      updated_at: row.updated_at != null ? String(row.updated_at) : "",
    };
    const authUser = await getUser();
    return applyScenario(safe, (authUser as any)?.user_metadata?.impersonation) as UserProfile;
  } catch {
    return null;
  }
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
