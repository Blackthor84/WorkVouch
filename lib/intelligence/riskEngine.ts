/**
 * Smart Candidate Risk Snapshot Engine (silent).
 * All outputs 0–100. Used only when risk_snapshot feature is enabled.
 * Call persistRiskSnapshot() when verification completes, dispute resolved, or reference submitted.
 */

export interface VerifiedJob {
  startDate?: string;
  endDate?: string | null;
  tenureMonths?: number;
}

export interface DisputeRecord {
  status?: string;
  resolved?: boolean;
}

export interface ReferenceResponse {
  respondedAt?: string;
  requestedAt?: string;
  responseTimeHours?: number;
}

export interface TenureEntry {
  startDate: string;
  endDate: string | null;
  months?: number;
}

export interface RiskSnapshotInput {
  verifiedJobs: VerifiedJob[];
  disputes: DisputeRecord[];
  referenceResponses: ReferenceResponse[];
  tenureHistory: TenureEntry[];
  rehireFlag: boolean;
}

export interface RiskSnapshot {
  tenureStabilityScore: number;
  referenceResponseRate: number;
  rehireLikelihoodIndex: number;
  employmentGapScore: number;
  disputeRiskScore: number;
  overallRiskScore: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Longer tenure = higher stability. More verified jobs = lower risk.
 * More disputes = higher risk. Faster reference response = positive. Rehire flag = boost.
 */
export function calculateRiskSnapshot(candidateData: RiskSnapshotInput): RiskSnapshot {
  const {
    verifiedJobs,
    disputes,
    referenceResponses,
    tenureHistory,
    rehireFlag,
  } = candidateData;

  const jobCount = verifiedJobs?.length ?? 0;
  const disputeCount = disputes?.length ?? 0;
  const resolvedDisputes = disputes?.filter((d) => d.status === "resolved" || d.resolved)?.length ?? 0;
  const openDisputes = disputeCount - resolvedDisputes;
  const refCount = referenceResponses?.length ?? 0;
  const tenureEntries = tenureHistory ?? [];
  const totalTenureMonths =
    tenureEntries.reduce((sum, t) => sum + (t.months ?? tenureMonths(t.startDate, t.endDate)), 0) ||
    (verifiedJobs as VerifiedJob[]).reduce(
      (sum, j) => sum + (j.tenureMonths ?? tenureMonths(j.startDate, j.endDate)),
      0
    );

  function tenureMonths(start?: string, end?: string | null): number {
    if (!start) return 0;
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    if (e < s) return 0;
    return (e - s) / (30.44 * 24 * 60 * 60 * 1000);
  }

  // Tenure stability: more months = higher score, cap at 100. 24+ months = 100.
  const tenureStabilityScore = clamp(Math.min(100, (totalTenureMonths / 24) * 100));

  // Reference response rate: % of references that responded (if we had requests, else 100).
  const refRequestCount = Math.max(refCount, 1);
  const referenceResponseRate = clamp((refCount / refRequestCount) * 100);

  // Rehire likelihood: rehire flag boosts; more verified jobs and tenure help.
  let rehireLikelihoodIndex = 50;
  if (rehireFlag) rehireLikelihoodIndex += 25;
  rehireLikelihoodIndex += Math.min(20, jobCount * 5);
  rehireLikelihoodIndex += Math.min(15, Math.floor(totalTenureMonths / 12));
  rehireLikelihoodIndex = clamp(rehireLikelihoodIndex);

  // Employment gap: inverse of stability; long tenure = fewer gaps = higher score.
  const employmentGapScore = clamp(100 - Math.min(50, Math.floor(totalTenureMonths / 6)));

  // Dispute risk: more open disputes = higher risk = lower score.
  const disputeRiskScore = clamp(100 - openDisputes * 25 - disputeCount * 5);

  // Overall: weighted blend. Rehire and tenure weighted positively, disputes negatively.
  let overall =
    tenureStabilityScore * 0.25 +
    referenceResponseRate * 0.2 +
    rehireLikelihoodIndex * 0.2 +
    employmentGapScore * 0.15 +
    disputeRiskScore * 0.2;
  if (rehireFlag) overall += 5;
  const overallRiskScore = clamp(overall);

  return {
    tenureStabilityScore,
    referenceResponseRate,
    rehireLikelihoodIndex,
    employmentGapScore,
    disputeRiskScore,
    overallRiskScore,
  };
}
