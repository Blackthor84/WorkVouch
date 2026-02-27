/**
 * Multiverse Trust Simulation — types.
 * All simulation data is local-only and reversible. No production data access.
 */

export type UniverseId = string;

/** Physics / rules for this universe (decay, thresholds, etc.) */
export type PhysicsProfile = {
  decayRate: number;
  threshold: number;
  fraudPenalty: number;
  verificationWeight: number;
};

export const DEFAULT_PHYSICS: PhysicsProfile = {
  decayRate: 1.0,
  threshold: 60,
  fraudPenalty: 1.0,
  verificationWeight: 1.0,
};

/** Intent classification for signals (Phase 5) */
export type SignalIntent = "helpful" | "self-serving" | "malicious" | "ambiguous";

/** Human error modifiers (Phase 5) */
export type HumanErrorModifiers = {
  fatigue: number;   // 0–1
  delay: number;     // ms or steps
  misclick: boolean;
  memoryDecay: number; // 0–1
};

/** Trust signal with intent and human error (Phase 5) */
export type TrustSignal = {
  id: string;
  source: "peer" | "supervisor" | "manager";
  weight: number;
  timestamp: number;
  intent?: SignalIntent;
  humanError?: HumanErrorModifiers;
};

/** Trust state at a point in time */
export type TrustState = {
  trustScore: number;
  confidenceScore: number;
  signals: TrustSignal[];
  /** Phase 6: hidden metrics */
  trustDebt?: number;
  trustFragility?: number;
};

/** Single timeline event (state + metadata) */
export type TimelineEvent = {
  at: number;
  state: TrustState;
  action?: string;
  auditId?: string;
};

/** Universe: parallel timeline with its own physics and trust state */
export type Universe = {
  id: UniverseId;
  label: string;
  physicsProfile: PhysicsProfile;
  timeline: TimelineEvent[];
  trustState: TrustState;
  createdAt: number;
  parentId: UniverseId | null;
  forkedAt?: number;
};

/** Audit trail entry (Phase 3) */
export type AuditEntry = {
  id: string;
  at: number;
  universeId: UniverseId;
  action: string;
  payload: unknown;
  outcome?: string;
};

/** Perspective lens (Phase 10) */
export type PerspectiveLens = "recruiter" | "enterprise_risk" | "regulator";

/** Decision override (Phase 3) */
export type DecisionOverride = "force_hire" | "force_reject" | null;
