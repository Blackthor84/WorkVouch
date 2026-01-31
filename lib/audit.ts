/**
 * Audit logging for Security Agency and platform events.
 * Writes to admin_actions (action_type + details). Service role only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type AuditActionType =
  | "impersonate"
  | "verification_requested"
  | "license_uploaded"
  | "risk_flagged"
  | "internal_note_created"
  | "enterprise_risk_model_setup";

export interface AuditPayload {
  admin_id?: string;
  employer_id?: string;
  profile_id?: string;
  target_id?: string;
  details?: string;
}

/**
 * Log an audit event. Never throws; logs errors to console.
 */
export async function logAuditAction(
  actionType: AuditActionType,
  payload: AuditPayload
): Promise<void> {
  try {
    const supabase = getSupabaseServer() as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    };
    const row: Record<string, unknown> = {
      action_type: actionType,
      admin_id: payload.admin_id ?? "system",
      impersonated_user_id: payload.target_id ?? payload.profile_id ?? payload.employer_id ?? "",
      details:
        typeof payload.details === "string"
          ? payload.details
          : payload.details != null
            ? JSON.stringify(payload.details)
            : null,
    };
    const { error } = await supabase.from("admin_actions").insert(row);
    if (error) console.error("[Audit] insert error:", error);
  } catch (e) {
    console.error("[Audit] logAuditAction error:", e);
  }
}
