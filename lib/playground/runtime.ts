import type { PlaygroundScenarioResult, PlaygroundScenarioMeta } from "./types";

const SCENARIOS: {
  id: string;
  title: string;
  run(): PlaygroundScenarioResult;
}[] = [
  {
    id: "resume_fraud",
    title: "Resume fraud discovered",
    run(): PlaygroundScenarioResult {
      return {
        id: "resume_fraud",
        title: "Resume Fraud Discovered",
        summary:
          "Employment dates conflicted with coworker verification. Trust score reduced.",
        before: { trustScore: 82, profileStrength: 76 },
        after: { trustScore: 51, profileStrength: 63 },
        events: [
          {
            type: "verification",
            message: "Coworker verification failed for 2 employers",
            impact: -20,
          },
          {
            type: "resume",
            message: "Resume timeline mismatch detected",
            impact: -11,
          },
        ],
      };
    },
  },
  {
    id: "coworker_success",
    title: "Coworker verification success",
    run(): PlaygroundScenarioResult {
      return {
        id: "coworker_success",
        title: "Coworker Verification Success",
        summary:
          "Multiple coworkers verified employment. Trust score increased.",
        before: { trustScore: 61, profileStrength: 58 },
        after: { trustScore: 89, profileStrength: 92 },
        events: [
          {
            type: "verification",
            message: "5 coworkers confirmed same role",
            impact: 22,
          },
          {
            type: "peer_review",
            message: "Positive peer reviews added",
            impact: 6,
          },
        ],
      };
    },
  },
  {
    id: "employment_gap",
    title: "Employment gap explained",
    run(): PlaygroundScenarioResult {
      return {
        id: "employment_gap",
        title: "Employment Gap Explained",
        summary:
          "Candidate provided context for gap; partial verification restored confidence.",
        before: { trustScore: 48, profileStrength: 52 },
        after: { trustScore: 65, profileStrength: 68 },
        events: [
          {
            type: "gap_explained",
            message: "Candidate submitted gap explanation (education, caregiving)",
            impact: 10,
          },
          {
            type: "partial_verification",
            message: "One employer verified; gap period documented",
            impact: 7,
          },
        ],
      };
    },
  },
  {
    id: "conflicting_claims",
    title: "Conflicting peer claims",
    run(): PlaygroundScenarioResult {
      return {
        id: "conflicting_claims",
        title: "Conflicting Peer Claims",
        summary:
          "Different peers gave conflicting accounts of tenure; score held until review.",
        before: { trustScore: 70, profileStrength: 72 },
        after: { trustScore: 58, profileStrength: 62 },
        events: [
          {
            type: "conflict",
            message: "Peer A and Peer B gave different tenure dates",
            impact: -8,
          },
          {
            type: "flag",
            message: "Profile flagged for manual review; no automatic penalty",
            impact: -4,
          },
        ],
      };
    },
  },
];

export function listScenarios(): PlaygroundScenarioMeta[] {
  return SCENARIOS.map((s) => ({ id: s.id, title: s.title }));
}

export function runScenario(
  id: string,
  _trustThreshold: number
): PlaygroundScenarioResult {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) throw new Error("Scenario not found");
  return scenario.run();
}

const AI_TITLES = [
  "Late verification from former manager",
  "Bulk peer reviews from same employer",
  "New credential verified",
  "Inconsistent job title across sources",
  "Contractor vs employee clarification",
];

const AI_EVENTS = [
  { type: "verification", message: "Former manager confirmed role and dates", impact: 15 },
  { type: "peer_review", message: "3 peers from same team submitted reviews", impact: 12 },
  { type: "credential", message: "License/certification verified", impact: 8 },
  { type: "discrepancy", message: "Job title updated to match employer records", impact: -5 },
  { type: "clarification", message: "Contractor status documented; tenure adjusted", impact: 6 },
];

export function generateAIScenario(): PlaygroundScenarioResult {
  const seed = Math.floor(Date.now() / 10000) % 100;
  const titleIndex = seed % AI_TITLES.length;
  const eventIndex = seed % AI_EVENTS.length;
  const baseTrust = 50 + (seed % 30);
  const delta = AI_EVENTS[eventIndex].impact;

  const title = AI_TITLES[titleIndex];
  const event = AI_EVENTS[eventIndex];
  const id = `ai_${seed}`;

  return {
    id,
    title,
    summary: `Simulated scenario: ${title.toLowerCase()}. Deterministic mock for demos.`,
    before: {
      trustScore: baseTrust,
      profileStrength: baseTrust - 2,
    },
    after: {
      trustScore: Math.max(0, Math.min(100, baseTrust + delta)),
      profileStrength: Math.max(0, Math.min(100, baseTrust - 2 + Math.round(delta * 0.8))),
    },
    events: [event],
  };
}
