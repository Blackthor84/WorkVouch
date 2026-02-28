/**
 * Simulated Employee Profile — editable design for the Employee Outcome Designer.
 * Maps to reviews and snapshot for trust/confidence/fragility/debt/compliance engines.
 * All data is SIMULATED; no real employee records are modified.
 */

import type { Industry } from "@/lib/industries";
import { INDUSTRY_THRESHOLDS } from "@/lib/industries";
import type { Review } from "@/lib/trust/types";
import { createInitialSnapshot, applyDelta } from "@/lib/trust/applyDelta";
import type { Snapshot } from "@/lib/trust/types";

export type PeerSentiment = "positive" | "neutral" | "negative";

/** Editable simulated employee profile. Primary object in the Outcome Designer. */
export interface SimulatedEmployeeProfile {
  industry: Industry;
  role: string;
  jobType: string;
  yearsExperience: number;
  employerCount: number;
  averageTenureMonths: number;
  employmentGapsMonths: number;
  supervisorVerificationCount: number;
  supervisorWeight: number;
  peerReviewCount: number;
  peerRecencyDays: number;
  peerSentiment: PeerSentiment;
  coworkerReviewCount: number;
  certificationsCount: number;
  networkStrength: number;
}

const SENTIMENT_WEIGHT: Record<PeerSentiment, number> = {
  positive: 1.2,
  neutral: 1,
  negative: 0.6,
};

/** Default profile for a new simulated employee. */
export function defaultSimulatedProfile(industry: Industry): SimulatedEmployeeProfile {
  return {
    industry,
    role: "Team member",
    jobType: "Full-time",
    yearsExperience: 5,
    employerCount: 2,
    averageTenureMonths: 28,
    employmentGapsMonths: 0,
    supervisorVerificationCount: 2,
    supervisorWeight: 1.2,
    peerReviewCount: 3,
    peerRecencyDays: 90,
    peerSentiment: "positive",
    coworkerReviewCount: 2,
    certificationsCount: 1,
    networkStrength: 5,
  };
}

let reviewIdCounter = 0;
function nextId(prefix: string): string {
  reviewIdCounter += 1;
  return `sim-${prefix}-${reviewIdCounter}-${Date.now()}`;
}

/**
 * Convert a simulated profile into a list of reviews for the trust engine.
 * Supervisor verifications, peer/coworker reviews, and certifications map to weighted reviews.
 */
export function profileToReviews(profile: SimulatedEmployeeProfile): Review[] {
  const reviews: Review[] = [];
  const now = Date.now();
  const peerTimestamp = now - profile.peerRecencyDays * 24 * 60 * 60 * 1000;
  const peerWeight = SENTIMENT_WEIGHT[profile.peerSentiment];

  for (let i = 0; i < profile.supervisorVerificationCount; i++) {
    reviews.push({
      id: nextId("sup"),
      source: "supervisor",
      weight: profile.supervisorWeight,
      timestamp: now - (i + 1) * 86400000,
    });
  }
  for (let i = 0; i < profile.peerReviewCount; i++) {
    reviews.push({
      id: nextId("peer"),
      source: "peer",
      weight: peerWeight,
      timestamp: peerTimestamp,
    });
  }
  for (let i = 0; i < profile.coworkerReviewCount; i++) {
    reviews.push({
      id: nextId("cow"),
      source: "peer",
      weight: 1,
      timestamp: now - (i + 1) * 86400000 * 7,
    });
  }
  for (let i = 0; i < profile.certificationsCount; i++) {
    reviews.push({
      id: nextId("cert"),
      source: "external",
      weight: 0.8,
      timestamp: now - (i + 1) * 86400000 * 180,
    });
  }

  const currentCount = reviews.length;
  const extra = Math.max(0, profile.networkStrength - currentCount);
  for (let i = 0; i < extra; i++) {
    reviews.push({
      id: nextId("net"),
      source: "peer",
      weight: 1,
      timestamp: now - (i + 1) * 86400000 * 30,
    });
  }

  return reviews;
}

/**
 * Build a full snapshot from a simulated profile. Re-runs trust, confidence, fragility, debt, compliance.
 * Uses industry threshold for compliance. All data is derived; no persistence.
 */
export function buildSnapshotFromProfile(
  profile: SimulatedEmployeeProfile,
  timestamp?: number
): Snapshot {
  const empty = createInitialSnapshot(timestamp ?? Date.now());
  const threshold = INDUSTRY_THRESHOLDS[profile.industry];
  const reviews = profileToReviews(profile);
  const next = applyDelta(
    empty,
    {
      timestamp: timestamp ?? Date.now(),
      addedReviews: reviews,
      thresholdOverride: threshold,
      metadata: { actionType: "profile_design", actor: "lab", notes: "SIMULATED — Employee Outcome Designer" },
    },
    { thresholdOverride: threshold }
  );
  return next;
}
