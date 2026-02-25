import { SANDBOX_SCENARIOS } from "./scenarios";
import { SandboxCompany, SandboxScenarioResult } from "./types";

export type SandboxScenarioItem = {
  id: string;
  title: string;
  run(): SandboxScenarioResult;
};

let customScenarios: SandboxScenarioItem[] = [];
let aiScenarios: SandboxScenarioItem[] = [];

// Deterministic AI-like scenario generator (NO external APIs)
function generateAIScenario(prompt: string) {
  const seed = prompt.toLowerCase();

  const negative = seed.includes("fraud") || seed.includes("fake") || seed.includes("lie");

  const trustDelta = negative ? -25 : +20;

  return {
    id: crypto.randomUUID(),
    title: negative
      ? "Potential Resume Fraud Detected"
      : "Strong Coworker Verification Signal",
    summary: negative
      ? "Conflicting coworker feedback reduced candidate trust."
      : "Multiple coworkers verified employment, increasing trust.",
    before: {
      trustScore: 70,
      profileStrength: 65,
    },
    after: {
      trustScore: 70 + trustDelta,
      profileStrength: 70,
    },
    events: [
      {
        type: negative ? "conflict" : "verification",
        message: negative
          ? "Coworker reports role mismatch"
          : "Two coworkers independently verified employment",
        impact: trustDelta,
      },
    ],
  };
}

export function addCustomScenario(input: any) {
  const id = input?.id ?? crypto.randomUUID();
  const title = input?.title ?? "Custom scenario";
  const trustDelta = typeof input?.trustDelta === "number" ? input.trustDelta : 0;
  customScenarios.push({
    id,
    title,
    run(): SandboxScenarioResult {
      return {
        scenarioId: id,
        title,
        summary: "Custom scenario (mock)",
        before: { trustScore: 70, profileStrength: 70 },
        after: { trustScore: 70 + trustDelta, profileStrength: 70 },
        events: [
          { type: "custom", message: "User-defined scenario executed", impact: trustDelta },
        ],
      };
    },
  });
}

export function addAIScenario(prompt: string): SandboxScenarioItem {
  const result = generateAIScenario(prompt);
  const scenario: SandboxScenarioItem = {
    id: result.id,
    title: result.title,
    run(): SandboxScenarioResult {
      return {
        scenarioId: result.id,
        title: result.title,
        summary: result.summary,
        before: result.before,
        after: result.after,
        events: result.events,
      };
    },
  };
  aiScenarios.push(scenario);
  return scenario;
}

export function listAllScenarios(): SandboxScenarioItem[] {
  return [...SANDBOX_SCENARIOS, ...customScenarios, ...aiScenarios];
}

export function runSandboxScenario(id: string): SandboxScenarioResult {
  const scenario = listAllScenarios().find((s) => s.id === id);
  if (!scenario) {
    throw new Error("Scenario not found");
  }
  return scenario.run();
}

export function exportScenario(result: any): string {
  return JSON.stringify(result, null, 2);
}

export function generateMockCompany(): SandboxCompany {
  const industries = ["Healthcare", "Security", "Construction", "Education"];
  const industry = industries[Math.floor(Math.random() * industries.length)];

  return {
    id: crypto.randomUUID(),
    name: `${industry} Corp ${Math.floor(Math.random() * 1000)}`,
    industry,
    size: Math.floor(Math.random() * 900 + 50),
    coworkers: Math.floor(Math.random() * 40 + 5),
    riskLevel: ["low", "medium", "high"][
      Math.floor(Math.random() * 3)
    ] as SandboxCompany["riskLevel"],
  };
}
