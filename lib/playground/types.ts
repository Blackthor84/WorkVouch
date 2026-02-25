export type PlaygroundEvent = {
  type: string;
  message: string;
  impact?: number;
};

export type PlaygroundScenarioResult = {
  id: string;
  title: string;
  summary: string;
  before: { trustScore: number; profileStrength: number };
  after: { trustScore: number; profileStrength: number };
  events: PlaygroundEvent[];
};

export type PlaygroundScenarioMeta = {
  id: string;
  title: string;
};

export type ExportPayload = {
  inputs: { scenarioId: string; trustThreshold: number };
  events: PlaygroundEvent[];
  outputs: { before: Record<string, number>; after: Record<string, number> };
  thresholdUsed: number;
  exportedAt: string;
};
