/**
 * Profile data for vertical dashboards and other features.
 * Merges profile (vertical, vertical_metadata) with intelligence snapshot (profile_strength).
 * Does not replace core scoring; provides a unified shape for vertical metric compute().
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import type { VerticalDashboardProfile } from "@/lib/verticals/dashboard";

export type ProfileDataResult = VerticalDashboardProfile & {
  id: string;
  industry?: string | null;
};

/**
 * Get current user profile data for vertical dashboard and similar views.
 * Includes profile_strength from intelligence_snapshots; tenure_months/sentiment_average
 * can be extended later (e.g. from employment_records / reviews).
 */
export async function getProfileData(): Promise<ProfileDataResult | null> {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as {
      from: (t: string) => { select: (s: string) => { eq: (k: string, v: string) => Promise<{ data: unknown; error: unknown }> } };
    };

    const { data: profile, error: profileError } = await supabaseAny
      .from("profiles")
      .select("id, industry, vertical, vertical_metadata")
      .eq("id", user.id) as { data: { id: string; industry?: string | null; vertical?: string | null; vertical_metadata?: Record<string, unknown> | null } | null; error: unknown };

    if (profileError || !profile) {
      return null;
    }

    const snapshot = await getOrCreateSnapshot(user.id);

    const result: ProfileDataResult = {
      id: profile.id,
      industry: profile.industry ?? undefined,
      vertical_metadata: profile.vertical_metadata ?? undefined,
      profile_strength: snapshot?.profile_strength ?? 0,
      tenure_months: undefined,
      sentiment_average: undefined,
    };

    return result;
  } catch {
    return null;
  }
}
