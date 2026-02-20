# Sandbox Scenario DSL

JSON-based Scenario DSL for deterministic, replayable abuse stress tests. **Production-safe**: no sandbox path alters core business logic; handlers call the same functions as real APIs.

## Architecture

- **DSL (types.ts)** — ScenarioDoc: id, name, mode (safe | real), actors, steps, assertions. Steps specify action, `as` (actor ref), params, expectations, real_only.
- **Run context (runContext.ts)** — Request-scoped `SandboxRunContext` (sandbox_id, scenario_id, mode, impersonated_user_id, step_id, admin_user_id, safe_mode). Set per step; cleared after. Handlers read via `getSandboxRunContext()`.
- **Action registry (actionRegistry.ts)** — Maps action names to real handlers: submit_reference, approve_reference, flag_abuse, file_dispute, resolve_dispute, recalc_reputation. Extensible via `registerAction()`.
- **Runner (runner.ts)** — Resolves actor refs to user ids, runs steps in order, substitutes `{{ref}}` in params, sets context, captures before/after state, calls `executeAction`, dual-logs, checks expectations, halts on failure. Supports `from_step_index` for replay.
- **Dual logging (dualLog.ts)** — Every mutation logs to **sandbox_events** (system audit: step_id, before_state, after_state, actor) and optionally **activity_log** (user-facing; use activity_log_user_id when impersonating for RLS).
- **Assertions** — Post-run invariants: reputation_delta_bounded, abuse_signals_triggered, trust_stabilizes, no_linear_boost. Implementations can use step-level score history when available.

## Production safety

- **Safe mode** — When scenario `mode === "safe"`, steps run with `safe_mode: true`; handlers skip irreversible writes. Steps with `real_only: true` are skipped in safe mode.
- **Impersonation** — Admin-only; runner sets context per step. Impersonation is session/cookie-based elsewhere and auto-expires; scenario runner does not persist impersonation beyond the run.
- **Audit** — All steps logged to sandbox_events (and activity_log where applicable) with step_id, before/after state, actor, so scenarios are replayable and auditable.
- **No core logic changes** — submit_reference, recalc_reputation, etc. call the same server-side functions used by the real APIs (e.g. submitSandboxReference, runSandboxIntelligenceRecalculation). No branching inside core logic on “sandbox”; only context is read for logging/identity.

## API

- **POST /api/sandbox/scenario/run** — Body: `sandbox_id`, optional `scenario_id` (built-in) or `scenario` (full ScenarioDoc), optional `actor_resolution`, optional `from_step_index`. Returns ScenarioRunResult.
- **GET /api/sandbox/events** — Query: `scenario_id`, `type`, `actor`, `sandbox_id`, `limit`. Returns events with step_id, before_state, after_state.

## Built-in scenarios

- `reputation_boost_ring` — Ring of mutual 5-star references.
- `employer_retaliation` — Employer flags abuse and files dispute.
- `impersonation_cascade` — Multiple steps as different actors; recalc.
- `reputation_oscillation` — Positive reference then abuse flag; recalc; assertions on trust stability.

Use `actor_resolution`: map each actor ref (e.g. `employee_1`, `admin`) to sandbox user id. API merges `admin` → current user id automatically.

## Scenario Fuzzer & Trust Curve

- **Fuzzer (fuzzer/generators.ts, runFuzzer.ts)** — Generates valid ScenarioDoc for attack types: boost_rings, retaliation, oscillation, impersonation_spam. Randomizes actor count, step order, and ratings (seed optional). Runs via real `runScenario()` with `onAfterStep` to capture per-actor trust snapshots; persists to `sandbox_fuzz_runs` and `sandbox_trust_snapshots`. Logs each run to sandbox_events (fuzz_run_started, fuzz_run_completed, fuzz_run_failed).
- **Invariants (fuzzer/invariants.ts)** — Evaluated after each run: reputation not linear under suspicious patterns, abuse signals triggered, trust stabilizes under oscillation, rate limits activate (when system emits them). Results stored on the run.
- **Trust Curve Visualizer** — Playground UI: list runs, select run, time-series chart of trust/reputation per actor (step_index vs profile_strength). Overlays abuse and rate-limit events (vertical reference lines). Replay from any step using stored scenario_doc and actor_resolution.
- **Design:** Snapshots are stored per step per actor so the visualizer can plot curves without re-running. Replay uses the same scenario and resolution from the run’s result_summary so it is deterministic and admin-only.
