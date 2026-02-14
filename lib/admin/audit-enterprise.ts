/**
 * Enterprise admin audit logging. EXACT schema: admin_user_id, admin_email, admin_role,
 * action_type, target_type, target_id, before_state, after_state, reason (NOT NULL), is_sandbox, ip_address, user_agent.
 *
 * SECURITY RULES:
 * - If an admin action cannot write to this table, THE ACTION MUST FAIL.
 * - This function THROWS on insert failure; callers must catch and fail the action (rollback/500).
 * - No silent failures. Ever. Audit logs are immutable (REVOKE UPDATE/DELETE in DB).
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type AuditTargetType =
  | "user"
  | "employer"
  | "review"
  | "trust_score"
  | "system"
  | "organization"
  | "role";

export type EnterpriseAuditParams = {
  admin_user_id: string;
  admin_email: string | null;
  admin_role: "admin" | "superadmin";
  action_type: string;
  target_type: AuditTargetType;
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string;
  is_sandbox: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
};

/**
 * Insert one row into admin_audit_logs. THROWS if insert fails so the action can fail.
 * Caller must ensure reason is non-empty (DB has NOT NULL; we enforce for audit quality).
 */
export async function writeAdminAuditLog(params: EnterpriseAuditParams): Promise<void> {
  const reason = params.reason?.trim() ?? "";
  const supabase = getServiceRoleClient() as any;
  const row = {
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email ?? null,
    admin_role: params.admin_role,
    action_type: params.action_type,
    target_type: params.target_type,
    target_id: params.target_id ?? null,
    before_state: params.before_state ?? null,
    after_state: params.after_state ?? null,
    reason: reason || "(no reason provided)",
    is_sandbox: params.is_sandbox,
    ip_address: params.ip_address ?? null,
    user_agent: params.user_agent ?? null,
  };
  const { error } = await supabase.from("admin_audit_logs").insert(row);
  if (error) {
    // If audit insert fails, the action MUST fail. No silent failures.
    throw new Error(`Audit log failed: ${error.message}`);
  }
  if (params.admin_role === "superadmin") {
    const { error: err2 } = await supabase.from("admin_audit_logs").insert({
      ...row,
      action_type: `${params.action_type}_superadmin`,
    });
    if (err2) throw new Error(`Audit log (superadmin) failed: ${err2.message}`);
  }
}
