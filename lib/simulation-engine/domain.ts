/**
 * Trust Simulation Engine — strict domain models.
 * No any, no unknown for core entities. All types are fully specified.
 */

export type ReviewSource = "peer" | "supervisor" | "manager" | "synthetic" | "self" | "external";

export interface Review {
  id: string;
  source: ReviewSource;
  weight: number;
  timestamp: number;
}

export interface SnapshotMetadata {
  actionType?: string;
  actor?: string;
  universeId?: string | null;
  notes?: string;
}

/** Numeric outputs from every engine run. Stored on Snapshot for audit and debug. */
export interface EngineOutputs {
  trustScore: number;
  confidenceScore: number;
  riskScore: number;
  fragilityScore: number;
  trustDebt: number;
  complianceScore: number;
  cultureImpactScore: number;
}

export interface Snapshot {
  timestamp: number;
  reviews: Review[];
  trustScore: number;
  confidenceScore: number;
  networkStrength: number;
  metadata?: SnapshotMetadata;
  /** Set by reducer pipeline; every snapshot has engine outputs after applyDelta. */
  engineOutputs?: EngineOutputs;
}

export interface IntentModifiers {
  humanErrorRate?: number;
  intentBias?: number;
  decayMultiplier?: number;
  supervisorWeightOverride?: number;
}

export interface SimulationDelta {
  timestamp?: number;
  addedReviews?: Review[];
  removedReviewIds?: string[];
  thresholdOverride?: number;
  scoreOverride?: number;
  intentModifiers?: IntentModifiers;
  notes?: string;
  metadata?: SnapshotMetadata;
}

export interface Policy {
  threshold: number;
  decayRate: number;
  supervisorWeight: number;
  riskTolerance: number;
}

export interface Employer {
  id: string;
  name: string;
  industry: string;
  policy: Policy;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  snapshot: Snapshot;
}

export interface Universe {
  id: string;
  name: string;
  timeline: Snapshot[];
  createdAt: number;
  parentId: string | null;
}

export interface Population {
  employees: Employee[];
  employer: Employer;
}
