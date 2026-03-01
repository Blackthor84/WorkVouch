/**
 * Retroactive verifications: when employer claims org, surface historical references.
 * Aggregate counts and roles; verification requests only with employee consent.
 * No identity exposure without consent.
 */

/** Aggregate summary (no PII). */
export interface RetroactiveRoleSummary {
  jobTitle: string;
  count: number;
}

export interface RetroactiveReferencesSummary {
  employerAccountId: string;
  companyName: string;
  totalRecords: number;
  roleSummaries: RetroactiveRoleSummary[];
  /** Count of records that have consented to verification (optional) */
  consentedCount: number;
}

/** Single reference request (for consent flow); minimal identity only after consent. */
export interface RetroactiveVerificationRequest {
  id: string;
  employmentRecordId: string;
  status: "pending_consent" | "consented" | "verified" | "rejected";
  requestedAt: string;
  /** Only present after consent or verification */
  candidateId?: string | null;
}
