/**
 * Profile data for vertical dashboards and other features.
 * Merges profile (vertical, vertical_metadata) with intelligence snapshot (profile_strength).
 * Does not replace core scoring; provides a unified shape for vertical metric compute().
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import type { VerticalDashboardProfile } from "@/lib/verticals/dashboard";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";
import { getEmployeeProfileFields } from "@/lib/identity/getProfileWithRole";

export type ProfileDataResult = VerticalDashboardProfile & {
  id: string;
  industry?: string | null;
};

/**
 * Get current user profile data for vertical dashboard and similar views.
 * Uses employee_profiles when present (role-specific), else falls back to profiles.
 * Includes profile_strength from intelligence_snapshots.
 */
export async function getProfileData(): Promise<ProfileDataResult | null> {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const employeeFields = await getEmployeeProfileFields(supabase, user.id);
    if (!employeeFields) {
      return null;
    }

    const snapshot = await getOrCreateSnapshot(user.id);

    const result: ProfileDataResult = {
      id: user.id,
      industry: employeeFields.industry ?? undefined,
      vertical_metadata: employeeFields.vertical_metadata ?? undefined,
      profile_strength: snapshot?.profile_strength ?? 0,
      tenure_months: undefined,
      sentiment_average: undefined,
    };

    const { data: { session } } = await supabase.auth.getSession();
    return applyScenario(result, (session as any)?.impersonation) as ProfileDataResult;
  } catch {
    return null;
  }
}
