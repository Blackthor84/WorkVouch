import { SandboxScenarioResult } from "./types";

export const SANDBOX_SCENARIOS = [
  {
    id: "resume_fraud",
    title: "Fake Resume Detected",
    run(): SandboxScenarioResult {
      return {
        scenarioId: "resume_fraud",
        title: "Fake Resume Detected",
        summary:
          "Employment dates conflicted with coworker verification. Trust score reduced.",
        before: {
          trustScore: 82,
          profileStrength: 76,
        },
        after: {
          trustScore: 51,
          profileStrength: 63,
        },
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
        warnings: [
          "User may be restricted from employer search",
          "Additional verification recommended",
        ],
      };
    },
  },
  {
    id: "trust_boost",
    title: "Coworker Trust Spike",
    run(): SandboxScenarioResult {
      return {
        scenarioId: "trust_boost",
        title: "Coworker Trust Spike",
        summary:
          "Multiple coworkers verified employment. Trust score increased.",
        before: {
          trustScore: 61,
          profileStrength: 58,
        },
        after: {
          trustScore: 89,
          profileStrength: 92,
        },
        events: [
          {
            type: "verification",
            message: "5 coworkers confirmed same role",
            impact: +22,
          },
          {
            type: "peer_review",
            message: "Positive peer reviews added",
            impact: +6,
          },
        ],
      };
    },
  },
];
