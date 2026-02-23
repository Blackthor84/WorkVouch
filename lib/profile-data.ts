/**
 * Profile data for vertical dashboards and other features.
 * Merges profile (vertical, vertical_metadata) with intelligence snapshot (profile_strength).
 * Does not replace core scoring; provides a unified shape for vertical metric compute().
 */

import { createServerSupabase, getSupabaseSession } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import type { VerticalDashboardProfile } from "@/lib/verticals/dashboard";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, industry, vertical, vertical_metadata")
      .eq("id", user.id)
      .maybeSingle();

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

    const { session } = await getSupabaseSession();
    return applyScenario(result, session?.impersonation) as ProfileDataResult;
  } catch {
    return null;
  }
}
