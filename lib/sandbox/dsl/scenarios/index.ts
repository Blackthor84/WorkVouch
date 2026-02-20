/**
 * Built-in abuse stress test scenarios (Scenario DSL). Load by id for POST /api/sandbox/scenario/run.
 */

import type { ScenarioDoc } from "../types";

const scenarios: Record<string, ScenarioDoc> = {};

/** Coordinated reputation boost ring: A→B→C→A mutual high ratings. */
const reputation_boost_ring: ScenarioDoc = {
  id: "reputation_boost_ring",
  name: "Coordinated reputation boost ring",
  description: "Actors give each other high ratings in a ring to inflate reputation.",
  mode: "real",
  actors: [
    { id: "a1", role: "employee", ref: "employee_1" },
    { id: "a2", role: "employee", ref: "employee_2" },
    { id: "a3", role: "employee", ref: "employee_3" },
  ],
  steps: [
    { step_id: "s1", action: "submit_reference", as: "employee_1", params: { reviewer_id: "{{employee_1}}", reviewed_id: "{{employee_2}}", rating: 5, review_text: "Excellent teammate." } },
    { step_id: "s2", action: "submit_reference", as: "employee_2", params: { reviewer_id: "{{employee_2}}", reviewed_id: "{{employee_3}}", rating: 5, review_text: "Top performer." } },
    { step_id: "s3", action: "submit_reference", as: "employee_3", params: { reviewer_id: "{{employee_3}}", reviewed_id: "{{employee_1}}", rating: 5, review_text: "Highly recommend." } },
    { step_id: "s4", action: "recalc_reputation", as: "admin", real_only: true },
  ],
  assertions: [
    { type: "no_linear_boost", actor_refs: ["employee_1", "employee_2", "employee_3"], max_combined_increase: 50 },
  ],
};

/** Employer retaliation: employer-actor flags abuse after negative pattern. */
const employer_retaliation: ScenarioDoc = {
  id: "employer_retaliation",
  name: "Employer retaliation abuse",
  description: "Employer flags abuse / files dispute in retaliation pattern.",
  mode: "real",
  actors: [
    { id: "emp", role: "employer", ref: "employer_1" },
    { id: "e1", role: "employee", ref: "employee_1" },
  ],
  steps: [
    { step_id: "s1", action: "flag_abuse", as: "employer_1", params: { target_user_id: "{{employee_1}}", reason: "retaliation_test" } },
    { step_id: "s2", action: "file_dispute", as: "employer_1", params: { target_reference_id: "ref_1", reason: "dispute_test" } },
  ],
  assertions: [
    { type: "abuse_signals_triggered", min_count: 1 },
  ],
};

/** Impersonation cascade: multiple steps as different actors. */
const impersonation_cascade: ScenarioDoc = {
  id: "impersonation_cascade",
  name: "Impersonation cascade",
  description: "Multiple actions under different impersonated actors.",
  mode: "real",
  actors: [
    { id: "e1", role: "employee", ref: "employee_1" },
    { id: "e2", role: "employee", ref: "employee_2" },
  ],
  steps: [
    { step_id: "s1", action: "submit_reference", as: "employee_1", params: { reviewer_id: "{{employee_1}}", reviewed_id: "{{employee_2}}", rating: 4 } },
    { step_id: "s2", action: "submit_reference", as: "employee_2", params: { reviewer_id: "{{employee_2}}", reviewed_id: "{{employee_1}}", rating: 4 } },
    { step_id: "s3", action: "flag_abuse", as: "employee_1", params: { target_user_id: "{{employee_2}}", reason: "cascade_test" } },
    { step_id: "s4", action: "recalc_reputation", as: "admin", real_only: true },
  ],
  assertions: [
    { type: "trust_stabilizes", actor_ref: "employee_1", window_steps: 4, max_oscillation: 20 },
  ],
};

/** Reputation oscillation: rapid up/down pattern. */
const reputation_oscillation: ScenarioDoc = {
  id: "reputation_oscillation",
  name: "Reputation oscillation attack",
  description: "Rapid positive then negative signals to test trust stability.",
  mode: "real",
  actors: [
    { id: "e1", role: "employee", ref: "employee_1" },
    { id: "e2", role: "employee", ref: "employee_2" },
  ],
  steps: [
    { step_id: "s1", action: "submit_reference", as: "employee_1", params: { reviewer_id: "{{employee_1}}", reviewed_id: "{{employee_2}}", rating: 5 } },
    { step_id: "s2", action: "recalc_reputation", as: "admin", real_only: true },
    { step_id: "s3", action: "flag_abuse", as: "employee_2", params: { target_user_id: "{{employee_1}}", reason: "oscillation_test" } },
    { step_id: "s4", action: "recalc_reputation", as: "admin", real_only: true },
  ],
  assertions: [
    { type: "trust_stabilizes", actor_ref: "employee_2", window_steps: 4, max_oscillation: 25 },
    { type: "reputation_delta_bounded", actor_ref: "employee_2", max_increase: 30, max_decrease: 20 },
  ],
};

function register(s: ScenarioDoc): void {
  scenarios[s.id] = s;
}
register(reputation_boost_ring);
register(employer_retaliation);
register(impersonation_cascade);
register(reputation_oscillation);

/**
 * Resolve param placeholders like {{employee_1}} with actor_resolution. Caller passes resolution after loading scenario.
 * Runner should resolve these when building params for a step. So scenarios can use "{{employee_1}}" in params and runner substitutes from actor_resolution.
 * For built-in scenarios we don't substitute here; the API caller provides actor_resolution and the runner uses it. So step params in scenarios use literal "{{employee_1}}" and the runner must substitute. Let me add substitution in the runner: when executing a step, for each param value that is a string and matches {{ref}}, replace with actor_resolution[ref].
 */
export function getScenarioById(id: string): ScenarioDoc | null {
  return scenarios[id] ?? null;
}

export function listScenarioIds(): string[] {
  return Object.keys(scenarios);
}
