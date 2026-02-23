/**
 * Trust score types for explainability, timeline, and reports.
 * In-memory / demo; no DB writes for scenario data.
 */

export type TrustSnapshot = {
  timestamp: number;
  trustScore: number;
  reason: string;
};

export type TrustTimelineEvent = {
  time: number;
  delta: number;
  reason: string;
};

export type TrustScoreInput = {
  overlapVerified?: boolean;
  managerReference?: boolean;
  peerReferences?: { id: string }[];
  tenureYears?: number;
  flags?: string[];
};

export type ReferenceInput = {
  id: string;
  [key: string]: unknown;
};

export type TrustScoreData = TrustScoreInput & {
  references?: ReferenceInput[];
};

export type ExplainTrustResult = {
  trustScore: number;
  topFactors: string[];
  riskFactors: string[];
  confidence: number;
};

export type TrustReport = {
  trustScore: number;
  strengths: string[];
  risks: string[];
  timeline: TrustSnapshot[];
  disclaimer: string;
};
