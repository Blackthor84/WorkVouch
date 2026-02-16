/**
 * SOC2 minimal audit logging. Tamper-resistant, append-only.
 * NEVER log: location values, IP addresses, user names/emails, raw request bodies.
 * Never crashes the app — log failure is reported only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type LogAuditParams = {
  actorId?: string | null;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
};

/**
 * Append one row to soc2_audit_log. Never throws; on failure logs and returns.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    await supabase.from("soc2_audit_log").insert({
      actor_id: params.actorId ?? null,
      action: params.action,
      resource: params.resource,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.error("[AUDIT LOG FAILED]", err);
    // never crash the app
  }
}
