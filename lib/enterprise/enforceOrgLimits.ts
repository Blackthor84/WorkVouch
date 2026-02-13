/**
 * Server-side enforcement of organization plan limits.
 * Call before org-scoped actions (unlock, add location, add admin).
 * Returns 403 payload when over limit; does not auto-disable account.
 * Superadmin always bypasses (allowed: true).
 */

import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrgPlanLimits, type OrgPlanType } from "./orgPlanLimits";

export interface OrgLimitCheckResult {
  allowed: boolean;
  error?: string;
  requiresUpgrade?: boolean;
  planType?: OrgPlanType;
}

export interface OrgLimitContext {
  organizationId: string;
  /** Current month YYYY-MM for unlock check */
  month?: string;
}

/**
 * Load org row and current usage; check against plan limits.
 * If over limit: set requires_enterprise = true (soft), insert enterprise_signal, return allowed: false.
 */
export async function checkOrgLimits(
  context: OrgLimitContext,
  action: "unlock" | "add_location" | "add_admin"
): Promise<OrgLimitCheckResult> {
  const role = await getCurrentUserRole();
  if (role === "superadmin") return { allowed: true, planType: undefined };

  const sb = getSupabaseServer() as any;
  const { data: org } = await sb
    .from("organizations")
    .select("id, plan_type, number_of_locations, requires_enterprise")
    .eq("id", context.organizationId)
    .single();
  if (!org) return { allowed: false, error: "Organization not found" };

  const planType = (org.plan_type ?? "starter") as string;
  const limits = getOrgPlanLimits(planType);
  if (limits.unlimited) return { allowed: true, planType: planType as OrgPlanType };

  const month = context.month ?? new Date().toISOString().slice(0, 7);

  const [locationsCount, employerUsersCount, usageRow] = await Promise.all([
    sb.from("locations").select("id", { count: "exact", head: true }).eq("organization_id", context.organizationId),
    sb.from("employer_users").select("id", { count: "exact", head: true }).eq("organization_id", context.organizationId),
    sb.from("organization_usage").select("unlock_count").eq("organization_id", context.organizationId).eq("month", month).maybeSingle(),
  ]);

  const locations = (locationsCount?.count ?? 0) as number;
  const admins = (employerUsersCount?.count ?? 0) as number;
  const unlocks = (usageRow?.unlock_count ?? 0) as number;

  let overLimit = false;
  let signalType: string | null = null;
  let value: number | null = null;

  if (action === "add_location" && limits.max_locations >= 0 && locations >= limits.max_locations) {
    overLimit = true;
    signalType = "location_overflow";
    value = locations;
  }
  if (action === "add_admin" && limits.max_admins >= 0 && admins >= limits.max_admins) {
    overLimit = true;
    signalType = "seat_overflow";
    value = admins;
  }
  if (action === "unlock" && limits.max_monthly_unlocks >= 0 && unlocks >= limits.max_monthly_unlocks) {
    overLimit = true;
    signalType = "unlock_overflow";
    value = unlocks;
  }

  if (overLimit && signalType) {
    await sb.from("organizations").update({ requires_enterprise: true }).eq("id", context.organizationId);
    await sb.from("enterprise_signals").insert({
      organization_id: context.organizationId,
      signal_type: signalType,
      value,
      resolved: false,
    });
    return {
      allowed: false,
      error: "Plan limit reached. Upgrade to Growth or Enterprise for more capacity.",
      requiresUpgrade: true,
      planType: planType as OrgPlanType,
    };
  }

  return { allowed: true, planType: planType as OrgPlanType };
}

/**
 * Increment unlock_count for organization_usage for the given month.
 * Call after a successful candidate unlock when org context exists.
 */
export async function incrementOrgUnlockCount(
  organizationId: string,
  month?: string
): Promise<void> {
  const m = month ?? new Date().toISOString().slice(0, 7);
  const sb = getSupabaseServer() as any;
  const { data: existing } = await sb
    .from("organization_usage")
    .select("id, unlock_count")
    .eq("organization_id", organizationId)
    .eq("month", m)
    .maybeSingle();
  if (existing) {
    await sb
      .from("organization_usage")
      .update({ unlock_count: (existing.unlock_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await sb.from("organization_usage").insert({
      organization_id: organizationId,
      month: m,
      unlock_count: 1,
      updated_at: new Date().toISOString(),
    });
  }
  import("@/lib/enterprise/orgHealthScore").then(({ updateOrgHealth }) => {
    updateOrgHealth(organizationId).catch(() => {});
  });
}
