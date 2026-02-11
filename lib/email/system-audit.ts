/**
 * Write security events to system_audit_logs.
 * [SECURITY] tags for observability.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type EmailChangeEventType =
  | "EMAIL_CHANGE_REQUEST"
  | "EMAIL_CHANGE_CONFIRMED"
  | "EMAIL_CHANGE_REVOKED"
  | "EMAIL_CHANGE_FORCED_ADMIN";

export async function logSystemAudit(params: {
  eventType: string;
  userId?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await (supabase as any).from("system_audit_logs").insert({
    event_type: params.eventType,
    user_id: params.userId ?? null,
    payload: params.payload ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  });
}

export function getAuditMeta(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ipAddress: ip, userAgent };
}
