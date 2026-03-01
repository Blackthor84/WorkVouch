/**
 * WorkVouch Credential: read-only, permissioned, time-stamped, shareable.
 * Employers may view verified work history, trust/confidence, human-factor insights.
 * Employers may NOT edit credentials.
 */

export type CredentialVisibility = "minimal" | "standard" | "full";

/** Work history entry for credential (no PII beyond what candidate allows). */
export interface CredentialWorkHistoryEntry {
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  verificationStatus: "pending" | "matched" | "verified" | "flagged";
  /** Omit employer_id and user_id in payload; company name only */
}

/** Human factor summary for credential (labels only, no scores). */
export interface CredentialHumanFactorSummary {
  displayName: string;
  oneLiner: string;
}

/** Payload stored in workvouch_credentials.payload. Safe for employer view. */
export interface WorkVouchCredentialPayload {
  version: 1;
  issuedAt: string; // ISO
  /** Work history entries (visibility may filter) */
  workHistory: CredentialWorkHistoryEntry[];
  /** Trust/confidence outcomes (no raw engine state) */
  trustScore: number;
  confidenceScore: number;
  /** Human-factor insight labels only (no numbers) */
  humanFactorSummaries?: CredentialHumanFactorSummary[];
  /** Industry context if available */
  industry?: string;
}

export interface WorkVouchCredentialRow {
  id: string;
  candidate_id: string;
  payload: WorkVouchCredentialPayload;
  visibility: CredentialVisibility;
  share_token: string | null;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}
