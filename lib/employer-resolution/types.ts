/**
 * Employer entity resolution: fuzzy name matching, confidence scores.
 * Never auto-verify based on name match alone.
 */

export type ResolutionStatus = "unclaimed" | "pending_claim" | "claimed_verified";

export interface EmployerResolutionMatch {
  employerAccountId: string | null;
  companyNameMatched: string | null;
  confidenceScore: number;
  status: ResolutionStatus;
  /** Input name that was resolved */
  inputName: string;
}

export interface EmployerResolutionResult {
  query: string;
  matches: EmployerResolutionMatch[];
  /** Best match if confidence >= threshold (still unclaimed until claim flow) */
  suggestedMatch: EmployerResolutionMatch | null;
}
