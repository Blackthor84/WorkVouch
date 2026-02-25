import { SANDBOX_SCENARIOS } from "./scenarios";
import { SandboxCompany, SandboxScenarioResult } from "./types";

export type SandboxScenarioItem = {
  id: string;
  title: string;
  run(): SandboxScenarioResult;
};

let customScenarios: SandboxScenarioItem[] = [];

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
  const scenario = generateAIScenario(prompt) as SandboxScenarioItem;
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
