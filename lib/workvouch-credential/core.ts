import type {
  WorkVouchCredentialPayload,
  CredentialWorkHistoryEntry,
  CredentialHumanFactorSummary,
} from "./types";

/** Human factor display names for credential (no scores). */
const HUMAN_FACTOR_SUMMARIES: CredentialHumanFactorSummary[] = [
  { displayName: "Peer Re-Engagement Stability", oneLiner: "Peers repeatedly choose to re-engage." },
  { displayName: "Signal Consistency Index", oneLiner: "Signals are consistent over time." },
  { displayName: "Coordination Cost Index", oneLiner: "Coordination cost derived from signal spread and recency." },
];

export interface BuildPayloadInput {
  candidateId: string;
  employmentRecords: {
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    verification_status: string;
  }[];
  trustScoreRow: {
    score: number;
    reference_count: number;
  } | null;
  industry?: string | null;
}

/**
 * Build WorkVouch Credential payload (read-only snapshot).
 * No PII beyond work history and outcomes; human factors are labels only.
 */
export function buildCredentialPayload(input: BuildPayloadInput): WorkVouchCredentialPayload {
  const workHistory: CredentialWorkHistoryEntry[] = input.employmentRecords.map((r) => ({
    companyName: r.company_name,
    jobTitle: r.job_title,
    startDate: r.start_date,
    endDate: r.end_date ?? null,
    isCurrent: Boolean(r.is_current),
    verificationStatus:
      r.verification_status === "verified"
        ? "verified"
        : r.verification_status === "matched"
          ? "matched"
          : r.verification_status === "flagged"
            ? "flagged"
            : "pending",
  }));

  const trustScore = input.trustScoreRow ? Number(input.trustScoreRow.score) : 0;
  const confidenceScore = input.trustScoreRow
    ? Math.min(100, (input.trustScoreRow.reference_count ?? 0) * 15)
    : 0;

  return {
    version: 1,
    issuedAt: new Date().toISOString(),
    workHistory,
    trustScore,
    confidenceScore,
    humanFactorSummaries: HUMAN_FACTOR_SUMMARIES,
    industry: input.industry ?? undefined,
  };
}
