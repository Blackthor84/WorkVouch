/**
 * Sandbox Activity Monitor: event log. GET /api/sandbox/events reads; logSandboxEvent writes.
 * If sandbox_events table is missing, getSandboxEvents returns []; logSandboxEvent no-ops.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type SandboxEventRow = {
  id: string;
  type: string;
  message: string;
  actor?: string | null;
  metadata?: object | null;
  created_at: string;
};

export type SandboxEventInput = {
  type: string;
  message: string;
  actor?: string;
  metadata?: Record<string, unknown>;
};

/** Log an event. Never throws. */
export async function logSandboxEvent(input: SandboxEventInput): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    await supabase.from("sandbox_events").insert({
      type: input.type,
      message: input.message,
      actor: input.actor ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (e) {
    console.error("[sandbox_events] log failed", e);
  }
}

/** Get latest events (newest first). Never returns null. */
export async function getSandboxEvents(limit = 100): Promise<SandboxEventRow[]> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("sandbox_events")
      .select("id, type, message, actor, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as SandboxEventRow[];
  } catch {
    return [];
  }
}
