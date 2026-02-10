/**
 * Admin audit logging. All admin actions on users should call this.
 * Uses service role to insert into admin_audit_logs.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type AuditAction =
  | "profile_update"
  | "role_change"
  | "status_update"
  | "suspend"
  | "unsuspend"
  | "soft_delete"
  | "hard_delete"
  | "recalculate"
  | "peer_review_delete"
  | "employment_record_delete";

export async function insertAdminAuditLog(params: {
  adminId: string;
  targetUserId: string;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from("admin_audit_logs").insert({
    admin_id: params.adminId,
    target_user_id: params.targetUserId,
    action: params.action,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    reason: params.reason ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });
}
