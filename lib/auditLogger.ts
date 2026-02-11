/**
 * Full system audit logging. Every sensitive action must call this.
 * Writes to system_audit_logs with actor, action, target, metadata.
 * [ADMIN_ACTION] [SECURITY] — no silent actions.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type AuditAction =
  | "admin_user_edit"
  | "role_change"
  | "email_change"
  | "profile_delete"
  | "profile_soft_delete"
  | "fraud_block"
  | "dispute_resolve"
  | "employment_confirm"
  | "intel_recalc"
  | "stripe_plan_change"
  | "email_change_request"
  | "email_change_confirmed"
  | "email_change_revoked"
  | "email_change_forced_admin"
  | "cron_nightly_run"
  | "sandbox_purge";

export async function auditLog(params: {
  actorUserId?: string | null;
  actorRole: string;
  action: AuditAction;
  targetUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await (supabase as any).from("system_audit_logs").insert({
    actor_user_id: params.actorUserId ?? null,
    actor_role: params.actorRole,
    action: params.action,
    target_user_id: params.targetUserId ?? null,
    metadata: params.metadata ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    event_type: params.action,
    user_id: params.actorUserId ?? null,
    payload: params.metadata ?? null,
  });
}

export function getAuditMetaFromRequest(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ipAddress: ip, userAgent };
}
