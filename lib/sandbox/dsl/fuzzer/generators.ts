/**
 * Scenario Fuzzer: generates valid Scenario DSL JSON for attack types.
 * Randomizes actor counts, step order, timing (step_id spacing), and ratings.
 * Production-safe: only produces documents; runner executes with real logic.
 */

import type { ScenarioDoc, ScenarioStep, ScenarioActor } from "../types";

export type FuzzAttackType = "boost_rings" | "retaliation" | "oscillation" | "impersonation_spam";

const REVIEW_TEXTS = [
  "Excellent teammate.",
  "Top performer.",
  "Highly recommend.",
  "Strong contributor.",
  "Great to work with.",
  "Reliable and professional.",
];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Seed-based RNG for reproducible fuzz (optional). */
function createRng(seed?: number): () => number {
  let s = seed ?? Date.now();
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export type GenerateOptions = {
  attack_type: FuzzAttackType;
  /** Min/max actors (employees). For boost_rings/oscillation/impersonation_spam. */
  actor_count?: { min: number; max: number };
  /** Optional seed for reproducibility */
  seed?: number;
  /** Scenario id prefix; run_id will be appended for uniqueness */
  scenario_id_prefix?: string;
};

/**
 * Generate a valid ScenarioDoc for the given attack type with randomization.
 */
export function generateScenario(options: GenerateOptions): ScenarioDoc {
  const rng = createRng(options.seed);
  const prefix = options.scenario_id_prefix ?? "fuzz";
  const runId = Math.random().toString(36).slice(2, 10);
  const scenarioId = `${prefix}_${options.attack_type}_${runId}`;

  switch (options.attack_type) {
    case "boost_rings":
      return generateBoostRings(scenarioId, rng, options.actor_count ?? { min: 3, max: 5 });
    case "retaliation":
      return generateRetaliation(scenarioId, rng);
    case "oscillation":
      return generateOscillation(scenarioId, rng, options.actor_count ?? { min: 2, max: 4 });
    case "impersonation_spam":
      return generateImpersonationSpam(scenarioId, rng, options.actor_count ?? { min: 2, max: 5 });
    default:
      return generateBoostRings(scenarioId, rng, { min: 3, max: 4 });
  }
}

function generateBoostRings(
  scenarioId: string,
  rng: () => number,
  count: { min: number; max: number }
): ScenarioDoc {
  const n = Math.floor(rng() * (count.max - count.min + 1)) + count.min;
  const actors: ScenarioActor[] = [];
  for (let i = 1; i <= n; i++) {
    actors.push({ id: `a${i}`, role: "employee", ref: `employee_${i}` });
  }
  const steps: ScenarioStep[] = [];
  for (let i = 0; i < n; i++) {
    const reviewer = i + 1;
    const reviewed = (i + 1) % n + 1;
    const rating = pick([4, 5], rng);
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "submit_reference",
      as: `employee_${reviewer}`,
      params: {
        reviewer_id: `{{employee_${reviewer}}}`,
        reviewed_id: `{{employee_${reviewed}}}`,
        rating,
        review_text: pick(REVIEW_TEXTS, rng),
      },
    });
  }
  const shuffled = shuffle(steps, rng);
  shuffled.push({
    step_id: `s${shuffled.length + 1}`,
    action: "recalc_reputation",
    as: "admin",
    real_only: true,
  });
  return {
    id: scenarioId,
    name: `Fuzz: boost ring (n=${n})`,
    description: "Randomized reputation boost ring.",
    mode: "real",
    actors: [...actors, { id: "admin", role: "admin", ref: "admin" }],
    steps: shuffled,
    assertions: [
      { type: "no_linear_boost", actor_refs: actors.map((a) => a.ref), max_combined_increase: 60 },
    ],
  };
}

function generateRetaliation(scenarioId: string, rng: () => number): ScenarioDoc {
  const steps: ScenarioStep[] = [
    {
      step_id: "s1",
      action: "flag_abuse",
      as: "employer_1",
      params: { target_user_id: "{{employee_1}}", reason: "fuzz_retaliation" },
    },
    {
      step_id: "s2",
      action: "file_dispute",
      as: "employer_1",
      params: { target_reference_id: "ref_1", reason: "fuzz_dispute" },
    },
  ];
  if (rng() > 0.5) steps.reverse();
  return {
    id: scenarioId,
    name: "Fuzz: employer retaliation",
    description: "Employer flags abuse and files dispute.",
    mode: "real",
    actors: [
      { id: "emp", role: "employer", ref: "employer_1" },
      { id: "e1", role: "employee", ref: "employee_1" },
    ],
    steps,
    assertions: [{ type: "abuse_signals_triggered", min_count: 1 }],
  };
}

function generateOscillation(
  scenarioId: string,
  rng: () => number,
  count: { min: number; max: number }
): ScenarioDoc {
  const n = Math.floor(rng() * (count.max - count.min + 1)) + count.min;
  const actors: ScenarioActor[] = [];
  for (let i = 1; i <= n; i++) {
    actors.push({ id: `a${i}`, role: "employee", ref: `employee_${i}` });
  }
  actors.push({ id: "admin", role: "admin", ref: "admin" });
  const steps: ScenarioStep[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i % n) + 1;
    const b = ((i + 1) % n) + 1;
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "submit_reference",
      as: `employee_${a}`,
      params: {
        reviewer_id: `{{employee_${a}}}`,
        reviewed_id: `{{employee_${b}}}`,
        rating: pick([4, 5], rng),
        review_text: pick(REVIEW_TEXTS, rng),
      },
    });
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "recalc_reputation",
      as: "admin",
      real_only: true,
    });
  }
  for (let i = 0; i < Math.min(2, n); i++) {
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "flag_abuse",
      as: `employee_${(i % n) + 1}`,
      params: { target_user_id: `{{employee_${((i + 1) % n) + 1}}}`, reason: "fuzz_oscillation" },
    });
  }
  steps.push({
    step_id: `s${steps.length + 1}`,
    action: "recalc_reputation",
    as: "admin",
    real_only: true,
  });
  return {
    id: scenarioId,
    name: `Fuzz: oscillation (n=${n})`,
    description: "Rapid positive then negative signals.",
    mode: "real",
    actors,
    steps: shuffle(steps, rng),
    assertions: [
      { type: "trust_stabilizes", actor_ref: "employee_1", window_steps: steps.length, max_oscillation: 25 },
    ],
  };
}

function generateImpersonationSpam(
  scenarioId: string,
  rng: () => number,
  count: { min: number; max: number }
): ScenarioDoc {
  const n = Math.floor(rng() * (count.max - count.min + 1)) + count.min;
  const actors: ScenarioActor[] = [];
  for (let i = 1; i <= n; i++) {
    actors.push({ id: `a${i}`, role: "employee", ref: `employee_${i}` });
  }
  actors.push({ id: "admin", role: "admin", ref: "admin" });
  const steps: ScenarioStep[] = [];
  const numRefs = n * 2;
  for (let k = 0; k < numRefs; k++) {
    const reviewer = (k % n) + 1;
    const reviewed = ((k + 1) % n) + 1;
    if (reviewer === reviewed) continue;
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "submit_reference",
      as: `employee_${reviewer}`,
      params: {
        reviewer_id: `{{employee_${reviewer}}}`,
        reviewed_id: `{{employee_${reviewed}}}`,
        rating: pick([3, 4, 5], rng),
        review_text: pick(REVIEW_TEXTS, rng),
      },
    });
  }
  for (let i = 0; i < Math.min(n, 3); i++) {
    steps.push({
      step_id: `s${steps.length + 1}`,
      action: "flag_abuse",
      as: `employee_${(i % n) + 1}`,
      params: { target_user_id: `{{employee_${((i + 1) % n) + 1}}}`, reason: "fuzz_spam" },
    });
  }
  steps.push({
    step_id: `s${steps.length + 1}`,
    action: "recalc_reputation",
    as: "admin",
    real_only: true,
  });
  return {
    id: scenarioId,
    name: `Fuzz: impersonation spam (n=${n})`,
    description: "Many actions under different actors.",
    mode: "real",
    actors,
    steps: shuffle(steps, rng),
    assertions: [{ type: "abuse_signals_triggered", min_count: 0 }],
  };
}
