import { supabase } from "@/lib/supabase/client";

export async function logAudit(
  actorId: string,
  action: string,
  meta: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    metadata: meta,
  });
  if (error) throw error;
}
