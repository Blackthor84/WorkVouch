/**
 * Auto-populate organization_features from organization plan_type.
 * Starter: no bulk_upload, no api_access, no multi_location.
 * Growth: bulk_upload, multi_location; no api_access unless enabled.
 * Enterprise: all enabled.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { normalizeOrgPlanType } from "./orgPlanLimits";

export async function getOrSetOrganizationFeatures(organizationId: string): Promise<{
  bulk_upload_enabled: boolean;
  api_access_enabled: boolean;
  multi_location_enabled: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
}> {
  const sb = getSupabaseServer() as any;
  const { data: org } = await sb.from("organizations").select("plan_type").eq("id", organizationId).single();
  const planType = normalizeOrgPlanType(org?.plan_type ?? null);
  const features = {
    bulk_upload_enabled: planType === "growth" || planType === "enterprise",
    api_access_enabled: planType === "enterprise",
    multi_location_enabled: planType === "growth" || planType === "enterprise",
    priority_support: planType === "enterprise",
    advanced_analytics: planType === "enterprise",
  };
  await sb.from("organization_features").upsert({
    organization_id: organizationId,
    ...features,
    updated_at: new Date().toISOString(),
  }, { onConflict: "organization_id" });
  return features;
}
