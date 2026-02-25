import type { TrustScenarioPayload } from "@/lib/trust/types";
import { SANDBOX_SCENARIOS } from "./scenarios";
import type { SandboxCompany } from "./types";

export type ScenarioDefinition = {
  id: string;
  title: string;
  getPayload(): TrustScenarioPayload;
};

let customScenarios: ScenarioDefinition[] = [];
let aiScenarios: ScenarioDefinition[] = [];

function generateAIPayload(prompt: string): TrustScenarioPayload {
  const seed = prompt.toLowerCase();
  const negative = seed.includes("fraud") || seed.includes("fake") || seed.includes("lie");
  const trustDelta = negative ? -25 : 20;
  const id = crypto.randomUUID();
  return {
    scenarioId: id,
    title: negative
      ? "Potential Resume Fraud Detected"
      : "Strong Coworker Verification Signal",
    summary: negative
      ? "Conflicting coworker feedback reduced candidate trust."
      : "Multiple coworkers verified employment, increasing trust.",
    before: { trustScore: 70, profileStrength: 65 },
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

export function addCustomScenario(input: {
  id?: string;
  title?: string;
  trustDelta?: number;
}) {
  const id = input?.id ?? crypto.randomUUID();
  const title = input?.title ?? "Custom scenario";
  const trustDelta = typeof input?.trustDelta === "number" ? input.trustDelta : 0;
  customScenarios.push({
    id,
    title,
    getPayload(): TrustScenarioPayload {
      return {
        scenarioId: id,
        title,
        summary: "Custom scenario (mock)",
        before: { trustScore: 70, profileStrength: 70 },
        after: { trustScore: 70 + trustDelta, profileStrength: 70 },
        events: [
          {
            type: "custom",
            message: "User-defined scenario executed",
            impact: trustDelta,
          },
        ],
      };
    },
  });
}

export function addAIScenario(prompt: string): ScenarioDefinition {
  const payload = generateAIPayload(prompt);
  const scenario: ScenarioDefinition = {
    id: payload.scenarioId,
    title: payload.title,
    getPayload: () => payload,
  };
  aiScenarios.push(scenario);
  return scenario;
}

function allDefinitions(): ScenarioDefinition[] {
  return [...SANDBOX_SCENARIOS, ...customScenarios, ...aiScenarios];
}

export function listScenarios(): { id: string; title: string }[] {
  return allDefinitions().map((s) => ({ id: s.id, title: s.title }));
}

export function listAllScenarios(): ScenarioDefinition[] {
  return allDefinitions();
}

export function getScenarioPayload(id: string): TrustScenarioPayload {
  const scenario = allDefinitions().find((s) => s.id === id);
  if (!scenario) throw new Error("Scenario not found");
  return scenario.getPayload();
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
