/**
 * Action Registry: maps DSL action names to real WorkVouch handlers.
 * No mocks; all handlers call existing business logic. Extensible for future actions.
 */

import type { SandboxRunContext } from "./runContext";
import { submitSandboxReference } from "@/lib/sandbox/actions/submitReference";
import { runSandboxIntelligenceRecalculation } from "@/lib/sandbox/recalculate";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type ActionHandlerResult =
  | { ok: true; result?: unknown }
  | { ok: false; status?: number; error: string };

export type ActionHandler = (
  params: Record<string, unknown>,
  context: SandboxRunContext
) => Promise<ActionHandlerResult>;

const registry = new Map<string, ActionHandler>();

/** submit_reference: reviewer_id, reviewed_id, rating?, review_text? */
registry.set("submit_reference", async (params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  const reviewer_id = params.reviewer_id as string | undefined;
  const reviewed_id = params.reviewed_id as string | undefined;
  if (!reviewer_id || !reviewed_id) {
    return { ok: false, status: 400, error: "Missing reviewer_id or reviewed_id" };
  }
  const out = await submitSandboxReference({
    sandbox_id: context.sandbox_id,
    reviewer_id,
    reviewed_id,
    rating: params.rating as number | undefined,
    review_text: (params.review_text as string) ?? null,
  });
  if (out.ok) return { ok: true, result: out.review };
  return { ok: false, status: out.status, error: out.error };
});

/** approve_reference: reference_id (sandbox has no approval workflow; no-op that succeeds) */
registry.set("approve_reference", async (_params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  return { ok: true, result: { message: "Sandbox has no approval workflow; no-op" } };
});

/** flag_abuse: target_user_id?, target_reference_id?, reason? — log only (no sandbox_abuse table yet) */
registry.set("flag_abuse", async (params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  await logSandboxEvent({
    type: "abuse_flagged",
    message: "Abuse flag recorded (sandbox)",
    actor: context.impersonated_user_id ?? context.admin_user_id,
    metadata: {
      target_user_id: params.target_user_id,
      target_reference_id: params.target_reference_id,
      reason: params.reason,
    },
    entity_type: "reference",
    sandbox_id: context.sandbox_id,
    scenario_id: context.scenario_id,
    step_id: context.step_id,
  });
  return { ok: true, result: { flagged: true } };
});

/** file_dispute: disputer_id, target_reference_id?, reason? — log only (sandbox has no disputes table) */
registry.set("file_dispute", async (params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  await logSandboxEvent({
    type: "dispute_filed",
    message: "Dispute filed (sandbox)",
    actor: context.impersonated_user_id ?? context.admin_user_id,
    metadata: {
      disputer_id: params.disputer_id ?? context.impersonated_user_id,
      target_reference_id: params.target_reference_id,
      reason: params.reason,
    },
    entity_type: "dispute",
    sandbox_id: context.sandbox_id,
    scenario_id: context.scenario_id,
    step_id: context.step_id,
  });
  return { ok: true, result: { filed: true } };
});

/** resolve_dispute: dispute_id?, resolution? — log only */
registry.set("resolve_dispute", async (params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  await logSandboxEvent({
    type: "dispute_resolved",
    message: "Dispute resolved (sandbox)",
    actor: context.impersonated_user_id ?? context.admin_user_id,
    metadata: {
      dispute_id: params.dispute_id,
      resolution: params.resolution,
    },
    entity_type: "dispute",
    sandbox_id: context.sandbox_id,
    scenario_id: context.scenario_id,
    step_id: context.step_id,
  });
  return { ok: true, result: { resolved: true } };
});

/** recalc_reputation: full sandbox intelligence recalculation */
registry.set("recalc_reputation", async (_params, context) => {
  if (context.safe_mode) {
    return { ok: true, result: { skipped: "safe_mode" } };
  }
  const out = await runSandboxIntelligenceRecalculation(context.sandbox_id);
  if (out.ok) return { ok: true, result: { recalculated: true } };
  return { ok: false, status: 500, error: out.error ?? "Recalc failed" };
});

/**
 * Execute an action by name. Returns handler result or error if action unknown.
 */
export async function executeAction(
  action: string,
  params: Record<string, unknown>,
  context: SandboxRunContext
): Promise<ActionHandlerResult> {
  const handler = registry.get(action);
  if (!handler) {
    return { ok: false, status: 400, error: `Unknown action: ${action}` };
  }
  return handler(params, context);
}

/**
 * Register a custom action (e.g. for tests or extensions).
 */
export function registerAction(name: string, handler: ActionHandler): void {
  registry.set(name, handler);
}

/**
 * List registered action names.
 */
export function listActions(): string[] {
  return Array.from(registry.keys());
}

/**
 * Get sandbox intelligence output for an employee (for assertions).
 */
export async function getSandboxEmployeeStrength(
  sandboxId: string,
  employeeId: string
): Promise<number | null> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sandbox_intelligence_outputs")
    .select("profile_strength")
    .eq("sandbox_id", sandboxId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  const row = data as { profile_strength?: number | null } | null;
  return row?.profile_strength != null ? Number(row.profile_strength) : null;
}
