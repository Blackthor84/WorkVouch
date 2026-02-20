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
  entity_type?: string | null;
  sandbox_id?: string | null;
  scenario_id?: string | null;
  step_id?: string | null;
  before_state?: object | null;
  after_state?: object | null;
};

export type SandboxEventInput = {
  type: string;
  message: string;
  actor?: string;
  metadata?: Record<string, unknown>;
  /** Entity affected: user, employment, reference, dispute, etc. */
  entity_type?: string | null;
  sandbox_id?: string | null;
  scenario_id?: string | null;
  /** Scenario step id when from DSL runner */
  step_id?: string | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
};

/** Log system activity. Every sandbox mutation must log here (and to activity_log when user-facing). Never throws. */
export async function logSandboxEvent(input: SandboxEventInput): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    await supabase.from("sandbox_events").insert({
      type: input.type,
      message: input.message,
      actor: input.actor ?? null,
      metadata: input.metadata ?? null,
      entity_type: input.entity_type ?? null,
      sandbox_id: input.sandbox_id ?? null,
      scenario_id: input.scenario_id ?? null,
      step_id: input.step_id ?? null,
      before_state: input.before_state ?? null,
      after_state: input.after_state ?? null,
    });
  } catch (e) {
    console.error("[sandbox_events] log failed", e);
  }
}

export type SandboxEventsFilter = {
  limit?: number;
  scenario_id?: string;
  type?: string;
  actor?: string;
  sandbox_id?: string;
};

/** Get latest events (newest first). Optional filters. Never returns null. */
export async function getSandboxEvents(limit?: number): Promise<SandboxEventRow[]>;
export async function getSandboxEvents(
  filter: SandboxEventsFilter
): Promise<SandboxEventRow[]>;
export async function getSandboxEvents(
  limitOrFilter?: number | SandboxEventsFilter
): Promise<SandboxEventRow[]> {
  const filter: SandboxEventsFilter =
    limitOrFilter === undefined
      ? { limit: 100 }
      : typeof limitOrFilter === "number"
        ? { limit: limitOrFilter }
        : limitOrFilter;
  const limit = Math.min(filter.limit ?? 100, 200);
  try {
    const supabase = getServiceRoleClient();
    let query = supabase
      .from("sandbox_events")
      .select("id, type, message, actor, metadata, created_at, entity_type, sandbox_id, scenario_id, step_id, before_state, after_state")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (filter.scenario_id) query = query.eq("scenario_id", filter.scenario_id);
    if (filter.type) query = query.eq("type", filter.type);
    if (filter.actor) query = query.eq("actor", filter.actor);
    if (filter.sandbox_id) query = query.eq("sandbox_id", filter.sandbox_id);
    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as SandboxEventRow[];
  } catch {
    return [];
  }
}
