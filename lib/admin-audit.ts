/**
 * Admin action audit logging. Writes to admin_audit_logs.
 * Never throws; logs to console on insert failure.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type AuditTargetType = "user" | "organization" | "role" | "impersonation" | "login" | "feature_flag";

export type AdminAuditPayload = {
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
 * Log an admin action. target_user_id in DB is set from target_id when target_type is "user", else admin_profile_id (no FK to org). Never throws.
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
    const { error } = await sb.from("admin_audit_logs").insert({
      admin_id: payload.admin_profile_id,
      target_user_id: targetUserId,
      action: payload.action,
      old_value: payload.old_value ?? null,
      new_value: newValue,
      reason: payload.reason ?? null,
    });
    if (error && process.env.NODE_ENV !== "test") {
      console.error("[admin-audit] insert failed:", error.message);
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.error("[admin-audit] error:", e instanceof Error ? e.message : e);
    }
  }
}
