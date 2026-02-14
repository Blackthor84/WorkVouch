/**
 * Admin audit logging. All admin actions MUST call this.
 * Uses enterprise schema: admin_user_id, action_type, target_type, target_id, before_state, after_state, reason (NOT NULL).
 * If insert fails, THROWS — action must fail. No silent failures.
 */

import { writeAdminAuditLog } from "./audit-enterprise";

export type AuditAction =
  | "profile_update"
  | "role_change"
  | "status_update"
  | "suspend"
  | "unsuspend"
  | "disable"
  | "reinstate"
  | "soft_delete"
  | "hard_delete"
  | "recalculate"
  | "peer_review_delete"
  | "employment_record_delete"
  | "user_email_change"
  | "admin_update_profile"
  | "employer_update_company"
  | "employer_suspend"
  | "employer_reactivate"
  | "review_remove"
  | "review_restore"
  | "trust_adjust"
  | "rehire_status_change"
  | "dispute_resolution"
  | "fraud_override"
  | "location_reassignment";

export async function insertAdminAuditLog(params: {
  adminId: string;
  adminEmail?: string | null;
  targetUserId?: string;
  targetType?: "user" | "employer" | "review" | "trust_score" | "system" | "organization" | "role";
  targetId?: string | null;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  adminRole?: "admin" | "superadmin";
  isSandbox?: boolean;
}): Promise<void> {
  const targetType = params.targetType ?? "user";
  const targetId = params.targetId ?? params.targetUserId ?? null;
  await writeAdminAuditLog({
    admin_user_id: params.adminId,
    admin_email: params.adminEmail ?? null,
    admin_role: params.adminRole ?? "admin",
    action_type: params.action,
    target_type: targetType,
    target_id: targetId,
    before_state: params.oldValue ?? null,
    after_state: params.newValue ?? null,
    reason: params.reason?.trim() ?? "",
    is_sandbox: params.isSandbox ?? false,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
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
