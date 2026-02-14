/**
 * Admin action audit logging. Writes to admin_audit_logs.
 * EVERY admin action must call this. Logs are immutable. Superadmin actions are double-logged.
 * Never throws; logs to console on insert failure.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type AuditTargetType =
  | "user"
  | "organization"
  | "role"
  | "impersonation"
  | "login"
  | "feature_flag"
  | "employer"
  | "review"
  | "trust_score"
  | "system";

export type AdminAuditPayload = {
  admin_profile_id: string;
  /** Role at time of action. Default "admin" if omitted (prefer passing explicitly). */
  admin_role?: "admin" | "superadmin";
  action: string;
  target_type: AuditTargetType;
  target_id: string;
  /** True if action was in sandbox mode; sandbox must never affect production. */
  is_sandbox?: boolean;
  impersonation_context?: string | null;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
};

/**
 * Insert one row into admin_audit_logs. Shared by logAdminAction.
 */
async function insertAuditRow(
  sb: Awaited<ReturnType<typeof getSupabaseServer>>,
  payload: AdminAuditPayload,
  row: {
    admin_id: string;
    target_user_id: string;
    action: string;
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown>;
    reason: string | null;
    admin_role: string | null;
    is_sandbox: boolean;
    ip_address?: string | null;
    user_agent?: string | null;
  }
): Promise<void> {
  const { error } = await sb.from("admin_audit_logs").insert(row);
  if (error && process.env.NODE_ENV !== "test") {
    console.error("[admin-audit] insert failed:", error.message);
  }
}

/**
 * Log an admin action. target_user_id in DB is set from target_id when target_type is "user", else admin_profile_id.
 * Superadmin actions are written twice (double-log). Never throws.
 */
export async function logAdminAction(payload: AdminAuditPayload): Promise<void> {
  try {
    const sb = getSupabaseServer();
    const targetUserId =
      payload.target_type === "user" ? payload.target_id : payload.admin_profile_id;
    const newValue = {
      ...(payload.new_value ?? {}),
      target_type: payload.target_type,
      target_id: payload.target_id,
      ...(payload.impersonation_context != null && { impersonation_context: payload.impersonation_context }),
    };
    const adminRole = payload.admin_role ?? "admin";
    const row = {
      admin_id: payload.admin_profile_id,
      target_user_id: targetUserId,
      action: payload.action,
      old_value: payload.old_value ?? null,
      new_value: newValue,
      reason: payload.reason ?? null,
      admin_role: adminRole,
      is_sandbox: payload.is_sandbox ?? false,
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
    };
    await insertAuditRow(sb, payload, row);
    if (adminRole === "superadmin") {
      await insertAuditRow(sb, payload, { ...row, action: `${payload.action}_superadmin` });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[admin-audit] error:", e instanceof Error ? e.message : e);
    }
  }
}
