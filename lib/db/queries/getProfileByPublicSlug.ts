import { admin } from "@/lib/supabase-admin";
import type { ProfileRow } from "@/lib/db/types";

const adminAny = admin as any;

/**
 * Get profile by public_slug (for candidate profile page).
 * Returns null if not found.
 */
export async function getProfileByPublicSlug(
  slug: string
): Promise<ProfileRow | null> {
  const { data, error } = await adminAny
    .from("profiles")
    .select("id, full_name, industry, professional_summary")
    .eq("public_slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ProfileRow | null;
}
