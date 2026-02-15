/**
 * SOC-2: Impersonation audit. Every start/end of impersonation is logged.
 * Append-only table; never update/delete.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type ImpersonationEvent = "start" | "end";
export type ImpersonationEnvironment = "production" | "sandbox";

export type ImpersonationAuditParams = {
  admin_user_id: string;
  admin_email?: string | null;
  target_user_id?: string | null;
  target_identifier?: string | null;
  event: ImpersonationEvent;
  environment: ImpersonationEnvironment;
  ip_address?: string | null;
  user_agent?: string | null;
};

export async function writeImpersonationAudit(params: ImpersonationAuditParams): Promise<void> {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("impersonation_audit").insert({
    admin_user_id: params.admin_user_id,
    admin_email: params.admin_email ?? null,
    target_user_id: params.target_user_id ?? null,
    target_identifier: params.target_identifier ?? null,
    event: params.event,
    environment: params.environment,
    ip_address: params.ip_address ?? null,
    user_agent: params.user_agent ?? null,
  });
  if (error) throw new Error(`Impersonation audit failed: ${error.message}`);
}
