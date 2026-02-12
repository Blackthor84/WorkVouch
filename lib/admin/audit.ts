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
  | "employment_record_delete"
  | "user_email_change"
  | "admin_update_profile"
  | "employer_update_company"
  | "rehire_status_change"
  | "dispute_resolution"
  | "fraud_override"
  | "location_reassignment";

export async function insertAdminAuditLog(params: {
  adminId: string;
  targetUserId: string;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  organizationId?: string | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await (supabase as any).from("admin_audit_logs").insert({
    admin_id: params.adminId,
    target_user_id: params.targetUserId,
    action: params.action,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    reason: params.reason ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    organization_id: params.organizationId ?? null,
  });
}

/** Get client IP from Next request headers (for audit). */
export function getClientIpFromHeaders(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    null
  );
}
