/**
 * Enterprise admin audit logging. Writes to admin_audit_logs.
 * Each entry: admin_profile_id, action, target_type, target_id, impersonation_context, timestamp.
 * Never throws.
 */

import { logAdminAction as writeLog } from "@/lib/admin-audit";

export type AuditTargetType = "user" | "organization" | "role" | "impersonation" | "login" | "feature_flag";

export type LogAdminActionParams = {
  admin_profile_id: string;
  action: string;
  target_type: AuditTargetType;
  target_id: string;
  impersonation_context?: string | null;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
};

/**
 * Log an admin action to admin_audit_logs (enterprise audit trail). Never throws.
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    await writeLog({
      admin_profile_id: params.admin_profile_id,
      action: params.action,
      target_type: params.target_type,
      target_id: params.target_id,
      impersonation_context: params.impersonation_context ?? null,
      old_value: params.old_value ?? null,
      new_value: params.new_value ?? null,
      reason: params.reason ?? null,
    });
  } catch {
    // no-op
  }
}
