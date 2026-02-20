/**
 * Sandbox Scenario DSL — JSON-based, deterministic, replayable.
 * Supports metadata, actors, multi-step execution, impersonation per step, params, expectations, assertions.
 */

export type ScenarioMode = "safe" | "real";

export type ActorRole = "employee" | "employer" | "admin";

export type ScenarioActor = {
  id: string;
  role: ActorRole;
  /** Reference in steps: "as": "employee_1" */
  ref: string;
  /** Resolved at runtime: sandbox user id (employee_id or employer_id) */
  resolved_id?: string;
};

export type ScenarioStep = {
  step_id: string;
  action: string;
  /** Actor ref (e.g. "employee_1") — runner resolves to resolved_id and sets impersonation for this step */
  as: string;
  params?: Record<string, unknown>;
  /** Optional: expected outcome for assertions */
  expectations?: {
    status?: number;
    ok?: boolean;
    error_contains?: string;
  };
  /** Optional: skip in safe mode */
  real_only?: boolean;
};

export type AssertionInvariant =
  | { type: "reputation_delta_bounded"; actor_ref: string; max_increase: number; max_decrease?: number }
  | { type: "abuse_signals_triggered"; min_count: number }
  | { type: "trust_stabilizes"; actor_ref: string; window_steps: number; max_oscillation: number }
  | { type: "no_linear_boost"; actor_refs: string[]; max_combined_increase: number };

export type ScenarioDoc = {
  id: string;
  name: string;
  description?: string;
  mode: ScenarioMode;
  /** Actors referenced by ref in steps */
  actors: ScenarioActor[];
  steps: ScenarioStep[];
  /** Post-run invariants (e.g. reputation, abuse signals) */
  assertions?: AssertionInvariant[];
};

export type StepResult = {
  step_id: string;
  action: string;
  as: string;
  resolved_actor_id: string | null;
  ok: boolean;
  status?: number;
  result?: unknown;
  error?: string;
  duration_ms: number;
};

export type AssertionResult = {
  assertion: AssertionInvariant;
  passed: boolean;
  message?: string;
  actual?: unknown;
};

export type ScenarioRunResult = {
  scenario_id: string;
  scenario_name: string;
  mode: ScenarioMode;
  safe_mode_used: boolean;
  steps: StepResult[];
  assertions: AssertionResult[];
  passed: boolean;
  duration_ms: number;
};
