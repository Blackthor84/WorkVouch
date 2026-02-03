/**
 * Shared auth for employer workforce-risk APIs.
 * Requires employer session and workforce_risk_dashboard feature.
 * Never exposes internal scoring logic.
 */

import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { checkFeatureAccess } from "@/lib/feature-flags";

export interface WorkforceRiskAuthResult {
  employerId: string;
  enterpriseOverrideEnabled: boolean;
  industry: string | null;
}

/**
 * Returns employer id and flags if session is employer and feature is enabled.
 * Throws no; returns null if unauthorized/forbidden/not found.
 */
export async function requireWorkforceRiskEmployer(): Promise<{
  supabase: ReturnType<typeof getSupabaseServer>;
  auth: WorkforceRiskAuthResult;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const hasEmployer = await hasRole("employer");
  if (!hasEmployer) return null;
  const allowed =
    (await checkFeatureAccess("enterprise_intelligence", { userId: user.id })) ||
    (await checkFeatureAccess("workforce_risk_dashboard", { userId: user.id }));
  if (!allowed) return null;

  const supabase = getSupabaseServer() as any;
  const { data: ea } = await supabase
    .from("employer_accounts")
    .select("id, enterprise_override_enabled, industry_key, industry")
    .eq("user_id", user.id)
    .maybeSingle();
  const employer = ea as {
    id: string;
    enterprise_override_enabled?: boolean;
    industry_key?: string | null;
    industry?: string | null;
  } | null;
  if (!employer?.id) return null;

  const industry =
    (employer.industry_key ?? employer.industry ?? null) != null
      ? String(employer.industry_key ?? employer.industry)
      : null;

  return {
    supabase,
    auth: {
      employerId: employer.id,
      enterpriseOverrideEnabled: employer.enterprise_override_enabled === true,
      industry,
    },
  };
}
