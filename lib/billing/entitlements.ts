import type { PlanKey } from "./plan";

export type EntitlementKey =
  | "viewTrustScore"
  | "viewReferenceSummary"
  | "viewFullReferences"
  | "viewTrustExplanation"
  | "exportTrustReport"
  | "hiringOutcomeSimulator"
  | "abuseSignals"
  | "apiAccess"
  | "candidateViewsPerMonth";

export type EntitlementsShape = {
  viewTrustScore: boolean;
  viewReferenceSummary: boolean;
  viewFullReferences: boolean;
  viewTrustExplanation: boolean;
  exportTrustReport: boolean;
  hiringOutcomeSimulator: boolean;
  abuseSignals: boolean;
  apiAccess: boolean;
  candidateViewsPerMonth: number;
  /** Active employer team members (seats). Prevents account sharing; enables team expansion revenue. */
  seatsIncluded: number;
};

export const ENTITLEMENTS: Record<PlanKey, EntitlementsShape> = {
  free: {
    viewTrustScore: true,
    viewReferenceSummary: true,
    viewFullReferences: false,
    viewTrustExplanation: false,
    exportTrustReport: false,
    hiringOutcomeSimulator: false,
    abuseSignals: false,
    apiAccess: false,
    candidateViewsPerMonth: 3,
    seatsIncluded: 1,
  },
  starter: {
    viewTrustScore: true,
    viewReferenceSummary: true,
    viewFullReferences: true,
    viewTrustExplanation: false,
    exportTrustReport: false,
    hiringOutcomeSimulator: false,
    abuseSignals: false,
    apiAccess: false,
    candidateViewsPerMonth: 10,
    seatsIncluded: 2,
  },
  pro: {
    viewTrustScore: true,
    viewReferenceSummary: true,
    viewFullReferences: true,
    viewTrustExplanation: true,
    exportTrustReport: true,
    hiringOutcomeSimulator: true,
    abuseSignals: true,
    apiAccess: false,
    candidateViewsPerMonth: 50,
    seatsIncluded: 5,
  },
  enterprise: {
    viewTrustScore: true,
    viewReferenceSummary: true,
    viewFullReferences: true,
    viewTrustExplanation: true,
    exportTrustReport: true,
    hiringOutcomeSimulator: true,
    abuseSignals: true,
    apiAccess: true,
    candidateViewsPerMonth: Infinity,
    seatsIncluded: Infinity,
  },
};

export function getEntitlements(plan: PlanKey): EntitlementsShape {
  return ENTITLEMENTS[plan] ?? ENTITLEMENTS.free;
}
