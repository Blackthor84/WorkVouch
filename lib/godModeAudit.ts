/**
 * God Mode audit: every Superadmin God Mode action. Mandatory logging.
 * Append-only; never update/delete.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type GodModeAuditParams = {
  superadmin_id: string;
  superadmin_email?: string | null;
  action: string;
  target_user_id?: string | null;
  target_identifier?: string | null;
  reason?: string | null;
  environment: "production" | "sandbox";
  ip_address?: string | null;
  user_agent?: string | null;
};

export async function writeGodModeAudit(params: GodModeAuditParams): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("god_mode_audit").insert({
      superadmin_id: params.superadmin_id,
      superadmin_email: params.superadmin_email ?? null,
      action: params.action,
      target_user_id: params.target_user_id ?? null,
      target_identifier: params.target_identifier ?? null,
      reason: params.reason ?? null,
      environment: params.environment,
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
    });
    if (error) console.error("[god_mode_audit] insert failed", error);
  } catch (e) {
    console.error("[god_mode_audit]", e);
  }
}
