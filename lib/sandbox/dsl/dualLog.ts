/**
 * Dual logging for simulation: every mutation logs to BOTH:
 * - sandbox_events (system audit: step_id, before/after state, actor)
 * - activity_log (user-facing timeline; use activity_log_user_id when impersonating for RLS).
 */

import { insertActivityLog } from "@/lib/activity";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";

export type DualLogInput = {
  /** System event type (e.g. reference_submitted, abuse_flagged) */
  type: string;
  message: string;
  /** User id performing the action (impersonated or admin) */
  actor_user_id: string;
  /** Human-readable actor name for display (e.g. "Employee A (impersonated)") */
  actor_display?: string;
  entity_type?: string | null;
  sandbox_id?: string | null;
  scenario_id?: string | null;
  step_id?: string | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  /** Flags triggered by this step (e.g. abuse_signal, reputation_cap) */
  triggered_flags?: string[];
  /** If true, also insert into activity_log (user-facing timeline). Use activity_log_user_id when impersonating (RLS: auth.uid() = user_id). */
  user_facing?: boolean;
  /** When set, activity_log row uses this as user_id (e.g. admin running scenario). Otherwise actor_user_id. */
  activity_log_user_id?: string;
};

/**
 * Log one sandbox mutation to sandbox_events and optionally to activity_log.
 * Never throws; logs errors to console.
 */
export async function logSandboxMutation(input: DualLogInput): Promise<void> {
  const metadata: Record<string, unknown> = {
    ...(input.triggered_flags?.length ? { triggered_flags: input.triggered_flags } : {}),
    ...(input.actor_display ? { actor_display: input.actor_display } : {}),
  };

  await logSandboxEvent({
    type: input.type,
    message: input.message,
    actor: input.actor_user_id,
    metadata: Object.keys(metadata).length ? metadata : undefined,
    entity_type: input.entity_type ?? null,
    sandbox_id: input.sandbox_id ?? null,
    scenario_id: input.scenario_id ?? null,
    step_id: input.step_id ?? null,
    before_state: input.before_state ?? null,
    after_state: input.after_state ?? null,
  });

  if (input.user_facing) {
    try {
      const logUserId = input.activity_log_user_id ?? input.actor_user_id;
      await insertActivityLog({
        userId: logUserId,
        action: input.type,
        target: input.entity_type ?? undefined,
        metadata: {
          sandbox_id: input.sandbox_id,
          scenario_id: input.scenario_id,
          step_id: input.step_id,
          before_state: input.before_state,
          after_state: input.after_state,
          triggered_flags: input.triggered_flags,
          actor_display: input.actor_display,
        },
        sandboxId: input.sandbox_id ?? undefined,
        scenarioId: input.scenario_id ?? undefined,
      });
    } catch (e) {
      console.error("[dualLog] activity_log insert failed", e);
    }
  }
}
