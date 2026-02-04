/**
 * Server-side feature flag checks for WorkVouch.
 * Role authority from user_roles via NextAuth session.
 * All checks enforced server-side; never trust client-only.
 * Optional in-memory cache to avoid repeated DB calls per request (scalable).
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const SERVER_CACHE_TTL_MS = 30 * 1000;
const serverCache = new Map<string, { result: boolean; ts: number }>();

function cacheKey(key: string, userId: string | null, employerId: string | null): string {
  return `${key}:${userId ?? ""}:${employerId ?? ""}`;
}

function getCached(key: string, userId: string | null, employerId: string | null): boolean | null {
  const k = cacheKey(key, userId, employerId);
  const entry = serverCache.get(k);
  if (!entry) return null;
  if (Date.now() - entry.ts > SERVER_CACHE_TTL_MS) {
    serverCache.delete(k);
    return null;
  }
  return entry.result;
}

function setCached(key: string, userId: string | null, employerId: string | null, result: boolean): void {
  serverCache.set(cacheKey(key, userId, employerId), { result, ts: Date.now() });
}

export type FeatureVisibility = "ui" | "api" | "both";

export interface CheckFeatureAccessOptions {
  /** Current user ID (profiles.id) */
  userId: string | null;
  /** Current employer account ID (employer_accounts.id) - resolved from userId if not provided */
  employerId?: string | null;
  /** If true, only return true when visibility allows UI. Use for UI rendering. */
  uiOnly?: boolean;
}

/** Tier order for comparison (lower index = lower tier). */
const PLAN_TIER_ORDER = ["free", "basic", "pro"] as const;
const SUBSCRIPTION_TIER_ORDER = ["starter", "pro", "custom"] as const;

/** Tier rank for subscription gates: starter < pro < custom. Legacy tiers map to canonical. */
const TIER_RANK: Record<string, number> = {
  starter: 1,
  pro: 2,
  custom: 3,
  lite: 1,
  team: 2,
  security_bundle: 2,
  security_agency: 2,
  enterprise: 3,
  pay_per_use: 1,
  free: 0,
  basic: 1,
};

/** When employer plan_tier is custom (or legacy security_agency), these features are auto-enabled server-side. */
const ENTERPRISE_AUTO_FEATURES = new Set([
  "risk_snapshot",
  "workforce_dashboard",
  "rehire_system",
  "license_upload",
  "internal_employer_notes",
  "structured_hiring_dashboard",
  "inconsistency_detection",
]);

function tierMeetsRequired(userTier: string | null, requiredTier: string): boolean {
  if (!userTier) return false;
  const r = requiredTier.toLowerCase().replace(/-/g, "_");
  const u = userTier.toLowerCase().replace(/-/g, "_");
  const userRank = TIER_RANK[u] ?? -1;
  const requiredRank = TIER_RANK[r] ?? -1;
  if (requiredRank >= 0 && userRank >= 0) return userRank >= requiredRank;
  const planIdx = PLAN_TIER_ORDER.indexOf(u as any);
  const subIdx = SUBSCRIPTION_TIER_ORDER.indexOf(u as any);
  const requiredPlanIdx = PLAN_TIER_ORDER.indexOf(r as any);
  const requiredSubIdx = SUBSCRIPTION_TIER_ORDER.indexOf(r as any);
  if (requiredPlanIdx >= 0) return planIdx >= 0 && planIdx >= requiredPlanIdx;
  if (requiredSubIdx >= 0) return subIdx >= 0 && subIdx >= requiredSubIdx;
  return u === r;
}

/**
 * Check if the user/employer meets the feature's required_subscription_tier.
 * Validates against employer_accounts.plan_tier OR user_subscriptions.tier.
 */
async function checkTierRequirement(
  supabase: any,
  userId: string | null,
  employerId: string | null,
  requiredTier: string | null
): Promise<boolean> {
  if (!requiredTier || requiredTier.trim() === "") return true;

  if (employerId) {
    const { data: emp } = await supabase
      .from("employer_accounts")
      .select("plan_tier")
      .eq("id", employerId)
      .maybeSingle();
    if (emp?.plan_tier && tierMeetsRequired(emp.plan_tier, requiredTier)) return true;
  }

  if (userId) {
    const { data: sub } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .or("status.eq.active,status.eq.trialing")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.tier && tierMeetsRequired(sub.tier, requiredTier)) return true;
  }

  return false;
}

/**
 * checkFeatureAccess(featureKey, userId)
 * Used in API routes, server components, and critical data-fetching logic.
 *
 * Logic:
 * 1. Fetch feature by key. If not found → false.
 * 2. If is_globally_enabled: check required_subscription_tier; if passes → true.
 * 3. Else: check assignment by user_id or employer_id; if assignment.enabled and tier passes → true.
 * 4. Otherwise → false.
 */
export async function checkFeatureAccess(
  featureKey: string,
  options: CheckFeatureAccessOptions
): Promise<boolean> {
  const { userId, employerId: employerIdOpt, uiOnly = false } = options;
  let employerId = employerIdOpt ?? null;
  if (userId && employerId == null) {
    const supabaseResolve = getSupabaseServer() as any;
    const { data: emp } = await supabaseResolve
      .from("employer_accounts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (emp?.id) employerId = emp.id;
  }
  const cached = getCached(featureKey, userId, employerId);
  if (cached !== null) return cached;

  const supabase = getSupabaseServer() as any;

  if (employerId && ENTERPRISE_AUTO_FEATURES.has(featureKey)) {
    const { data: emp } = await supabase
      .from("employer_accounts")
      .select("plan_tier")
      .eq("id", employerId)
      .maybeSingle();
    const planTier = (emp as { plan_tier?: string } | null)?.plan_tier ?? "";
    const normalized = planTier.toLowerCase().replace(/-/g, "_");
    if (normalized === "custom" || normalized === "enterprise" || normalized === "security_agency" || normalized === "security_bundle") {
      setCached(featureKey, userId, employerId, true);
      return true;
    }
  }

  const { data: flag, error: flagError } = await supabase
    .from("feature_flags")
    .select("id, is_globally_enabled, visibility_type, required_subscription_tier")
    .eq("key", featureKey)
    .single();

  if (flagError || !flag) {
    setCached(featureKey, userId, employerId, false);
    return false;
  }

  const visibilityOk =
    !uiOnly ||
    flag.visibility_type === "ui" ||
    flag.visibility_type === "both";
  if (!visibilityOk) {
    setCached(featureKey, userId, employerId, false);
    return false;
  }

  if (flag.is_globally_enabled) {
    const tierOk = await checkTierRequirement(
      supabase,
      userId,
      employerId,
      flag.required_subscription_tier
    );
    setCached(featureKey, userId, employerId, tierOk);
    return tierOk;
  }

  const orConditions: string[] = [];
  if (userId) orConditions.push(`user_id.eq.${userId}`);
  if (employerId) orConditions.push(`employer_id.eq.${employerId}`);
  if (orConditions.length === 0) {
    setCached(featureKey, userId, employerId, false);
    return false;
  }

  const { data: assignments } = await supabase
    .from("feature_flag_assignments")
    .select("id, enabled, expires_at")
    .eq("feature_flag_id", flag.id)
    .eq("enabled", true)
    .or(orConditions.join(","));

  const now = new Date().toISOString();
  const validAssignments = Array.isArray(assignments)
    ? assignments.filter((a: { expires_at?: string | null }) => !a.expires_at || a.expires_at > now)
    : [];
  if (validAssignments.length === 0) {
    setCached(featureKey, userId, employerId, false);
    return false;
  }

  const tierOk = await checkTierRequirement(
    supabase,
    userId,
    employerId,
    flag.required_subscription_tier
  );
  setCached(featureKey, userId, employerId, tierOk);
  return tierOk;
}

/**
 * Legacy: check by name (maps to key for backwards compatibility).
 * Prefer checkFeatureAccess(featureKey, options).
 */
export async function isFeatureEnabled(
  featureNameOrKey: string,
  options: CheckFeatureAccessOptions = { userId: null }
): Promise<boolean> {
  return checkFeatureAccess(featureNameOrKey, options);
}

/**
 * Grant beta access to a user for a number of days. Creates a feature_flag_assignment with expires_at.
 * Use feature key "beta_access" by default. Requires service role (admin client).
 */
export async function grantBetaAccess(
  userId: string,
  days: number,
  options: { featureKey?: string; employerId?: string | null } = {}
): Promise<{ ok: boolean; error?: string }> {
  const { featureKey = "beta_access", employerId = null } = options;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  const supabase = getSupabaseServer() as any;
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("id")
    .eq("key", featureKey)
    .single();
  if (!flag) return { ok: false, error: `Feature ${featureKey} not found` };
  const row = {
    feature_flag_id: flag.id,
    enabled: true,
    expires_at: expiresAt,
    ...(employerId ? { employer_id: employerId, user_id: null } : { user_id: userId, employer_id: null }),
  };
  const { error } = await supabase.from("feature_flag_assignments").insert(row);
  if (error) {
    if (error.code === "23505") {
      const { error: updateErr } = await supabase
        .from("feature_flag_assignments")
        .update({ enabled: true, expires_at: expiresAt })
        .eq("feature_flag_id", flag.id)
        .eq(employerId ? "employer_id" : "user_id", employerId ?? userId);
      if (updateErr) return { ok: false, error: updateErr.message };
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
