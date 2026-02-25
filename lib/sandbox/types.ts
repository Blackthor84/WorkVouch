export type SandboxRole = "user" | "admin" | "superadmin";

export type SandboxScenarioResult = {
  scenarioId: string;
  title: string;
  summary: string;
  before: Record<string, number>;
  after: Record<string, number>;
  events: {
    type: string;
    message: string;
    impact?: number;
  }[];
  warnings?: string[];
};

export type SandboxCompany = {
  id: string;
  name: string;
  industry: string;
  size: number;
  coworkers: number;
  riskLevel: "low" | "medium" | "high";
};
