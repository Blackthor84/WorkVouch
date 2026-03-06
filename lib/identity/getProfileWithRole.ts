/**
 * Identity + role-specific profile helpers.
 * Prefer employee_profiles / employer_profiles for role-specific fields;
 * profiles remains the source for id, email, full_name, role, created_at.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export type IdentityProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  created_at: string;
};

export type EmployeeProfileRow = Database["public"]["Tables"]["employee_profiles"]["Row"];
export type EmployerProfileRow = Database["public"]["Tables"]["employer_profiles"]["Row"];

export type ProfileWithEmployee = IdentityProfile & {
  employee_profile: EmployeeProfileRow | null;
  employer_profile: null;
};

export type ProfileWithEmployer = IdentityProfile & {
  employee_profile: null;
  employer_profile: EmployerProfileRow | null;
};

export type ProfileWithRoleTables = IdentityProfile & {
  employee_profile: EmployeeProfileRow | null;
  employer_profile: EmployerProfileRow | null;
};

/**
 * Fetch profile identity (profiles) plus role-specific rows (employee_profiles, employer_profiles).
 * Use for new code paths that should read from role tables instead of overloading profiles.
 */
export async function getProfileWithRoleTables(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<ProfileWithRoleTables | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const [empRes, eprRes] = await Promise.all([
    supabase.from("employee_profiles").select("*").eq("profile_id", profileId).maybeSingle(),
    supabase.from("employer_profiles").select("*").eq("profile_id", profileId).maybeSingle(),
  ]);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role ?? null,
    created_at: profile.created_at,
    employee_profile: empRes.data ?? null,
    employer_profile: eprRes.data ?? null,
  };
}

/**
 * Prefer employee_profiles for industry/vertical when present; else fall back to profiles.
 * Use when you need employee-only fields for display (backward compatible).
 */
export async function getEmployeeProfileFields(
  supabase: SupabaseClient<Database>,
  profileId: string
): Promise<{
  industry: string | null;
  vertical: string | null;
  vertical_metadata: Database["public"]["Tables"]["employee_profiles"]["Row"]["vertical_metadata"];
  professional_summary: string | null;
  profile_photo_url: string | null;
  visibility: "public" | "private";
} | null> {
  const { data: ep } = await supabase
    .from("employee_profiles")
    .select("industry, vertical, vertical_metadata, professional_summary, profile_photo_url, visibility")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (ep) {
    return {
      industry: ep.industry ?? null,
      vertical: ep.vertical ?? null,
      vertical_metadata: ep.vertical_metadata ?? null,
      professional_summary: ep.professional_summary ?? null,
      profile_photo_url: ep.profile_photo_url ?? null,
      visibility: (ep.visibility as "public" | "private") ?? "public",
    };
  }

  const { data: p } = await supabase
    .from("profiles")
    .select("industry, vertical, vertical_metadata, professional_summary, profile_photo_url, visibility")
    .eq("id", profileId)
    .maybeSingle();

  if (!p) return null;
  return {
    industry: (p as { industry?: string | null }).industry ?? null,
    vertical: (p as { vertical?: string | null }).vertical ?? null,
    vertical_metadata: ((p as { vertical_metadata?: Json | null }).vertical_metadata ?? null) as Database["public"]["Tables"]["employee_profiles"]["Row"]["vertical_metadata"],
    professional_summary: (p as { professional_summary?: string | null }).professional_summary ?? null,
    profile_photo_url: (p as { profile_photo_url?: string | null }).profile_photo_url ?? null,
    visibility: ((p as { visibility?: string }).visibility as "public" | "private") ?? "public",
  };
}
