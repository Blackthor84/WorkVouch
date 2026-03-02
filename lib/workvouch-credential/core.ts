import type {
  WorkVouchCredentialPayload,
  CredentialWorkHistoryEntry,
  CredentialHumanFactorSummary,
  CredentialVerifiedEmploymentSummary,
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
  /** Verified employment summary (total/verified roles, coverage %) */
  verifiedEmploymentSummary?: CredentialVerifiedEmploymentSummary;
  /** Trust band label (e.g. "Verified") */
  trustBand?: string;
  /** Trust trajectory: improving | stable | at_risk */
  trustTrajectory?: string;
  /** Trust trajectory display label */
  trustTrajectoryLabel?: string;
  /** Verification coverage % (0–100) */
  verificationCoveragePct?: number;
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

  const totalRoles = input.employmentRecords.length;
  const verifiedRoles = input.employmentRecords.filter((r) => r.verification_status === "verified").length;
  const verificationCoveragePct = input.verificationCoveragePct ?? (totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0);
  const verifiedEmploymentSummary: CredentialVerifiedEmploymentSummary | undefined =
    input.verifiedEmploymentSummary ?? (totalRoles > 0 ? { totalRoles, verifiedRoles, verificationCoveragePct } : undefined);

  return {
    version: 1,
    issuedAt: new Date().toISOString(),
    workHistory,
    trustScore,
    confidenceScore,
    humanFactorSummaries: HUMAN_FACTOR_SUMMARIES,
    industry: input.industry ?? undefined,
    verifiedEmploymentSummary,
    trustBand: input.trustBand,
    trustTrajectory: input.trustTrajectory,
    trustTrajectoryLabel: input.trustTrajectoryLabel,
    verificationCoveragePct,
  };
}
