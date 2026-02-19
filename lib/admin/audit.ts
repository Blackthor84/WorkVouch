/**
 * Admin audit logging. All admin actions MUST call this.
 * Uses enterprise schema: admin_user_id, action_type, target_type, target_id, before_state, after_state, reason (NOT NULL).
 * If insert fails, THROWS — action must fail. No silent failures.
 */

import { NextRequest } from "next/server";
import { writeAdminAuditLog } from "./audit-enterprise";
import { getAuditRequestMeta } from "./getAuditRequestMeta";

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
  | "location_reassignment"
  | "admin_override_enabled"
  | "playground_mutation_under_override";

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

/**
 * Log an admin action with payload shape: action_type, target_type, target_id, before_state, after_state, reason, is_sandbox.
 * Fills admin_user_id, admin_email, admin_role, ip_address, user_agent from admin + req.
 * THROWS if audit insert fails.
 */
export type LogAdminActionPayload = {
  action_type: string;
  target_type: "user" | "employer" | "review" | "trust_score" | "system" | "organization" | "role";
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string;
  is_sandbox: boolean;
};

export type AdminContextForAudit = {
  userId: string;
  email?: string | null;
  isSuperAdmin: boolean;
};

export async function logAdminAction(
  admin: AdminContextForAudit,
  req: NextRequest,
  payload: LogAdminActionPayload
): Promise<void> {
  const { ipAddress, userAgent } = getAuditRequestMeta(req);
  await writeAdminAuditLog({
    admin_user_id: admin.userId,
    admin_email: admin.email ?? null,
    admin_role: admin.isSuperAdmin ? "superadmin" : "admin",
    action_type: payload.action_type,
    target_type: payload.target_type,
    target_id: payload.target_id ?? null,
    before_state: payload.before_state ?? null,
    after_state: payload.after_state ?? null,
    reason: payload.reason?.trim() ?? "",
    is_sandbox: payload.is_sandbox,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
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
