/**
 * WorkVouch Risk Intelligence Engine v1.
 * All scores 0–100. Versioned and explainable.
 */

export const RISK_VERSION = "1.0";

export type RiskComponents = {
  tenure: number;
  references: number;
  disputes: number;
  gaps: number;
  rehire: number;
  overall: number;
  confidence: number;
  version: string;
};

export interface TenureData {
  jobs: { start_date: string; end_date: string | null }[];
}

export interface ReferenceData {
  total: number;
  responded: number;
  responseTimeHours?: number[];
}

export interface DisputeData {
  total: number;
  resolved: number;
}

export interface GapData {
  totalMonthsGap: number;
  totalTenureMonths: number;
}

export interface RehireData {
  rehireEligible: boolean;
}

export interface RiskEngineInput {
  tenure: TenureData;
  references: ReferenceData;
  disputes: DisputeData;
  gaps: GapData;
  rehire: RehireData;
  verifiedJobsCount?: number;
  dataCompletenessBonus?: number;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function tenureMonths(start: string, end: string | null): number {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  if (e < s) return 0;
  return (e - s) / (30.44 * 24 * 60 * 60 * 1000);
}

/**
 * Tenure score: longer tenure = higher (better). 24+ months total = 100.
 */
export function calculateTenureScore(data: TenureData): number {
  const jobs = data?.jobs ?? [];
  const totalMonths = jobs.reduce(
    (sum, j) => sum + tenureMonths(j.start_date, j.end_date),
    0
  );
  return clamp(Math.min(100, (totalMonths / 24) * 100));
}

/**
 * Reference score: more responses = better. Response rate 0–100.
 */
export function calculateReferenceScore(data: ReferenceData): number {
  const total = data?.total ?? 0;
  const responded = data?.responded ?? 0;
  if (total <= 0) return 100;
  return clamp((responded / total) * 100);
}

/**
 * Dispute score: fewer open disputes = higher. Open = total - resolved.
 */
export function calculateDisputeScore(data: DisputeData): number {
  const total = data?.total ?? 0;
  const resolved = data?.resolved ?? 0;
  const open = total - resolved;
  return clamp(100 - open * 25 - total * 5);
}

/**
 * Gap score: fewer gaps relative to tenure = higher.
 */
export function calculateGapScore(data: GapData): number {
  const tenure = data?.totalTenureMonths ?? 0;
  const gap = data?.totalMonthsGap ?? 0;
  if (tenure <= 0) return 100;
  const ratio = gap / tenure;
  return clamp(100 - Math.min(80, ratio * 100));
}

/**
 * Rehire score: rehire eligible = 100, else 0 (or lower if we add tiers later).
 */
export function calculateRehireScore(data: RehireData): number {
  return data?.rehireEligible ? 100 : 0;
}

/**
 * Confidence: verifiedJobs*10 + references*0.2 + dataCompletenessBonus, clamped 0–100.
 */
export function calculateConfidence(input: RiskEngineInput): number {
  const verified = input.verifiedJobsCount ?? 0;
  const refCount = input.references?.responded ?? input.references?.total ?? 0;
  const bonus = input.dataCompletenessBonus ?? 0;
  const base = verified * 10 + refCount * 0.2 + bonus;
  return clamp(base);
}

/**
 * Composite overall score.
 * overall = tenure*0.25 + references*0.20 + disputes*0.25 + gaps*0.15 + rehire*0.15
 */
export function calculateRiskComponents(input: RiskEngineInput): RiskComponents {
  const tenure = calculateTenureScore(input.tenure);
  const references = calculateReferenceScore(input.references);
  const disputes = calculateDisputeScore(input.disputes);
  const gaps = calculateGapScore(input.gaps);
  const rehire = calculateRehireScore(input.rehire);

  const overall = clamp(
    tenure * 0.25 +
      references * 0.2 +
      disputes * 0.25 +
      gaps * 0.15 +
      rehire * 0.15
  );

  const confidence = calculateConfidence(input);

  return {
    tenure,
    references,
    disputes,
    gaps,
    rehire,
    overall,
    confidence,
    version: RISK_VERSION,
  };
}
