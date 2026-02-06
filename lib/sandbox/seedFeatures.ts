/**
 * Feature flag auto-seed. On session creation, insert default sandbox_features (all true).
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const DEFAULT_FEATURE_KEYS = [
  "intelligence_engine",
  "team_fit",
  "hiring_confidence",
  "workforce_risk",
  "fraud_detection",
  "ad_simulator",
  "revenue_simulator",
  "enterprise_mode",
];

export async function seedSandboxFeatures(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceRoleClient();
  const rows = DEFAULT_FEATURE_KEYS.map((feature_key) => ({
    sandbox_id: sandboxId,
    feature_key,
    is_enabled: true,
  }));
  const { error } = await supabase.from("sandbox_features").upsert(rows, { onConflict: "sandbox_id,feature_key" });
  if (error) {
    console.error("seedSandboxFeatures:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
