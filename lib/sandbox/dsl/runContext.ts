/**
 * Sandbox run context — injected into all downstream logic during scenario execution.
 * Available to action handlers and logging. Never alters core business logic; only provides identity/env.
 */

export type SandboxRunContext = {
  sandbox_id: string;
  scenario_id: string;
  mode: "safe" | "real";
  /** Current step's actor (impersonated user id for this step) */
  impersonated_user_id: string | null;
  step_id: string | null;
  /** Admin running the scenario (auth.uid()) */
  admin_user_id: string;
  /** When true, handlers must not perform irreversible writes */
  safe_mode: boolean;
};

let currentContext: SandboxRunContext | null = null;

/**
 * Set context for the current execution. Call at start of scenario/step; clear at end.
 */
export function setSandboxRunContext(ctx: SandboxRunContext | null): void {
  currentContext = ctx;
}

/**
 * Get current sandbox run context. Returns null when not in a scenario run.
 */
export function getSandboxRunContext(): SandboxRunContext | null {
  return currentContext;
}

/**
 * Build context for a step. safe_mode = true when scenario.mode === "safe" (runner skips real_only steps in safe mode).
 */
export function buildStepContext(params: {
  sandbox_id: string;
  scenario_id: string;
  mode: "safe" | "real";
  impersonated_user_id: string | null;
  step_id: string;
  admin_user_id: string;
}): SandboxRunContext {
  return {
    sandbox_id: params.sandbox_id,
    scenario_id: params.scenario_id,
    mode: params.mode,
    impersonated_user_id: params.impersonated_user_id,
    step_id: params.step_id,
    admin_user_id: params.admin_user_id,
    safe_mode: params.mode === "safe",
  };
}
