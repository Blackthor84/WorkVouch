/**
 * Rule Versioning - immutable trust-critical rule sets. Sandbox can run multiple versions in parallel.
 * Why: Every trust decision must be explainable; rules are versioned, immutable, and diffable for audit.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type RuleSetName =
  | "trust_score_formula"
  | "overlap_verification"
  | "review_weighting"
  | "penalty_thresholds"
  | "fraud_detection_thresholds";

/** Rule version type for UI and active_in (sandbox | prod). */
export type RuleType = "trust" | "overlap" | "review" | "penalty" | "fraud";

/** TrustRule schema - stored in config JSONB for trust_score_formula versions. */
export type TrustRule = {
  base_score: number;
  verification_weight: number;
  review_weight: number;
  penalty_multiplier: number;
  min_score: number;
  max_score: number;
};

/** OverlapRule schema - stored in config JSONB for overlap_verification versions. */
export type OverlapRule = {
  min_overlap_days: number;
  min_independent_verifiers: number;
  circular_verification_block: boolean;
  verifier_trust_threshold: number;
};

export type RuleVersionRow = {
  id: string;
  rule_set_name: string;
  version_tag: string;
  config: Record<string, unknown>;
  is_active_sandbox: boolean;
  is_active_production: boolean;
  created_by: string | null;
  created_at: string;
};

export async function listRuleVersions(ruleSetName?: string): Promise<RuleVersionRow[]> {
  const sb = getSupabaseServer();
  let q = sb.from("sandbox_rule_versions").select("*").order("created_at", { ascending: false });
  if (ruleSetName) q = q.eq("rule_set_name", ruleSetName);
  const { data } = await q;
  return (data ?? []) as RuleVersionRow[];
}

export async function getActiveRuleVersion(ruleSetName: RuleSetName, env: "sandbox" | "production"): Promise<RuleVersionRow | null> {
  const sb = getSupabaseServer();
  const col = env === "sandbox" ? "is_active_sandbox" : "is_active_production";
  const { data } = await sb.from("sandbox_rule_versions").select("*").eq("rule_set_name", ruleSetName).eq(col, true).maybeSingle();
  return data as RuleVersionRow | null;
}

export async function createRuleVersion(params: {
  ruleSetName: RuleSetName;
  versionTag: string;
  config: Record<string, unknown>;
  setActiveSandbox?: boolean;
  setActiveProduction?: boolean;
  createdBy?: string | null;
}): Promise<{ id: string } | null> {
  const sb = getSupabaseServer();
  if (params.setActiveSandbox) {
    await sb.from("sandbox_rule_versions").update({ is_active_sandbox: false }).eq("rule_set_name", params.ruleSetName);
  }
  if (params.setActiveProduction) {
    await sb.from("sandbox_rule_versions").update({ is_active_production: false }).eq("rule_set_name", params.ruleSetName);
  }
  const { data, error } = await sb.from("sandbox_rule_versions").insert({
    rule_set_name: params.ruleSetName,
    version_tag: params.versionTag,
    config: params.config,
    is_active_sandbox: params.setActiveSandbox ?? false,
    is_active_production: params.setActiveProduction ?? false,
    created_by: params.createdBy ?? null,
  }).select("id").single();
  if (error) return null;
  return data as { id: string };
}

export function diffRuleConfigs(configA: Record<string, unknown>, configB: Record<string, unknown>): { key: string; oldValue: unknown; newValue: unknown }[] {
  const keys = new Set([...Object.keys(configA), ...Object.keys(configB)]);
  const diffs: { key: string; oldValue: unknown; newValue: unknown }[] = [];
  for (const key of keys) {
    const a = configA[key];
    const b = configB[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ key, oldValue: a, newValue: b });
  }
  return diffs;
}
