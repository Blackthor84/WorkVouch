export type PipelineStage = "new" | "reviewing" | "verified" | "hired" | "rejected";
export type RiskLevel = "low" | "medium" | "high";

export type HiringIntelligenceCandidate = {
  candidateId: string;
  savedAt: string;
  fullName: string;
  industry: string | null;
  roleHint: string | null;
  trustScore: number | null;
  verificationCount: number;
  pipelineStage: PipelineStage;
  riskLevel: RiskLevel;
};
