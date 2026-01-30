/**
 * WorkVouch Insights Suite – server-side calculations only.
 * Reference Consistency, Workforce Stability, Environment Fit.
 * Cache per candidate 15 minutes. No personality traits; work-behavior data only.
 */

const INSIGHTS_CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<
  string,
  { data: WorkVouchInsightsPayload; ts: number }
>();

export type EmployerTier = "emp_lite" | "emp_pro" | "emp_enterprise";

export type ConsistencyLabel = "High Consistency" | "Moderate Consistency" | "Low Consistency";
export type StabilityLabel = "High Stability" | "Moderate Stability" | "Low Stability";
export type ConfidenceLabel = "Low Confidence" | "Moderate Confidence" | "High Confidence";

export interface ReferenceConsistencyResult {
  alignmentScore: number;
  label: ConsistencyLabel;
  referenceCount: number;
  sufficientData: boolean;
}

export interface StabilityResult {
  level: StabilityLabel;
  summary: string;
  sufficientData: boolean;
}

export interface EnvironmentFitResult {
  bestFit: { environment: string; confidencePct: number; confidenceLabel: ConfidenceLabel };
  secondaryFit: { environment: string; confidencePct: number; confidenceLabel: ConfidenceLabel } | null;
  breakdown: { category: string; score: number }[];
  sufficientData: boolean;
}

export interface WorkVouchInsightsPayload {
  reference_consistency: ReferenceConsistencyResult | null;
  stability_index: StabilityResult | null;
  environment_fit_indicator: EnvironmentFitResult | null;
}

/** Map plan_tier from DB to employer insight tier. */
export function toEmployerTier(planTier: string | null): EmployerTier {
  const t = (planTier || "").toLowerCase();
  if (t === "emp_enterprise") return "emp_enterprise";
  if (t === "emp_pro") return "emp_pro";
  if (t === "emp_lite") return "emp_lite";
  if (t === "pro") return "emp_pro";
  if (t === "basic") return "emp_pro";
  return "emp_lite";
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return sqDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/** 0–100: higher = more consistent. Inverse of normalized variance (so low variance = high score). */
export function computeReferenceConsistency(
  references: { rating?: number }[]
): ReferenceConsistencyResult {
  const ratings = references
    .map((r) => (typeof r.rating === "number" ? r.rating : 0))
    .filter((r) => r >= 1 && r <= 5);
  const refCount = ratings.length;
  const sufficientData = refCount >= 3;

  if (refCount < 2) {
    return {
      alignmentScore: 0,
      label: "Low Consistency",
      referenceCount: refCount,
      sufficientData: false,
    };
  }

  const v = variance(ratings);
  const maxVariance = 4; // 1-5 scale max variance
  const normalizedVariance = Math.min(1, v / maxVariance);
  const alignmentScore = Math.round(100 * (1 - normalizedVariance));
  const clamped = Math.max(0, Math.min(100, alignmentScore));

  let label: ConsistencyLabel = "Low Consistency";
  if (clamped >= 80) label = "High Consistency";
  else if (clamped >= 50) label = "Moderate Consistency";

  return {
    alignmentScore: clamped,
    label,
    referenceCount: refCount,
    sufficientData,
  };
}

function monthsBetween(start: string, end: string | null): number {
  try {
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : Date.now();
    return Math.max(0, Math.floor((e - s) / (30 * 24 * 60 * 60 * 1000)));
  } catch {
    return 0;
  }
}

/** Tenure, job frequency, peer confirmation -> stability level and summary. */
export function computeStabilityIndex(
  jobs: { start_date?: string; end_date?: string | null }[],
  peerConfirmedPct: number = 0
): StabilityResult {
  if (jobs.length === 0) {
    return {
      level: "Low Stability",
      summary: "Insufficient employment history for stability insight.",
      sufficientData: false,
    };
  }

  const tenures = jobs.map((j) =>
    monthsBetween(j.start_date || "", j.end_date ?? null)
  );
  const avgTenure = tenures.reduce((a, b) => a + b, 0) / tenures.length;
  const jobCount = jobs.length;
  const hasPeerBonus = peerConfirmedPct >= 70;

  let level: StabilityLabel = "Low Stability";
  if (avgTenure >= 24) level = "High Stability";
  else if (avgTenure >= 12) level = "Moderate Stability";
  if (jobCount >= 5) level = level === "High Stability" ? "Moderate Stability" : "Low Stability";
  if (hasPeerBonus && level === "Moderate Stability") level = "High Stability";
  if (hasPeerBonus && level === "Low Stability") level = "Moderate Stability";

  const summaries: Record<StabilityLabel, string> = {
    "High Stability": "Demonstrates consistent employment patterns and long-term role retention.",
    "Moderate Stability": "Shows stable employment with moderate role transitions.",
    "Low Stability": "Frequent job transitions observed in recent history.",
  };

  return {
    level,
    summary: summaries[level],
    sufficientData: true,
  };
}

const ENVIRONMENT_MODELS = [
  "Structured / High Supervision",
  "Fast-Paced / High Pressure",
  "Independent / Autonomous",
  "Team-Centric / Collaborative",
  "Process-Driven / Compliance-Focused",
] as const;

/** Weighted scoring from reference ratings and stability/consistency. No personality; work-behavior only. */
export function computeEnvironmentFit(
  references: { rating?: number }[],
  stabilityLevel: StabilityLabel,
  consistencyLabel: ConsistencyLabel
): EnvironmentFitResult {
  const ratings = references
    .map((r) => (typeof r.rating === "number" ? r.rating : 0))
    .filter((r) => r >= 1 && r <= 5);
  const sufficientData = ratings.length >= 2;

  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const teamwork = Math.min(100, Math.round(avgRating * 22));
  const independence = stabilityLevel === "High Stability" ? 75 : stabilityLevel === "Moderate Stability" ? 55 : 35;
  const deadlineReliability = Math.min(100, Math.round(avgRating * 22));
  const communication = Math.min(100, Math.round(avgRating * 20));
  const supervisionNeeds = consistencyLabel === "High Consistency" ? 40 : consistencyLabel === "Moderate Consistency" ? 55 : 70;

  const breakdown = [
    { category: "Teamwork", score: teamwork },
    { category: "Independence", score: independence },
    { category: "Deadline Reliability", score: deadlineReliability },
    { category: "Communication", score: communication },
    { category: "Supervision Needs", score: 100 - supervisionNeeds },
  ];

  const scores: Record<string, number> = {};
  scores["Team-Centric / Collaborative"] = (teamwork + communication) / 2;
  scores["Independent / Autonomous"] = (independence + (100 - supervisionNeeds)) / 2;
  scores["Fast-Paced / High Pressure"] = (deadlineReliability + independence) / 2;
  scores["Process-Driven / Compliance-Focused"] = (100 - supervisionNeeds + (breakdown[2].score)) / 2;
  scores["Structured / High Supervision"] = (supervisionNeeds + 100 - independence) / 2;

  const sorted = (Object.entries(scores) as [string, number][])
    .sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const second = sorted[1];
  const toConfidence = (s: number): number => Math.min(95, Math.max(45, Math.round(s)));
  const toLabel = (pct: number): ConfidenceLabel =>
    pct >= 70 ? "High Confidence" : pct >= 55 ? "Moderate Confidence" : "Low Confidence";

  const bestConfidence = toConfidence(top[1]);
  const secondaryConfidence = second ? toConfidence(second[1]) : 0;

  return {
    bestFit: {
      environment: top[0],
      confidencePct: bestConfidence,
      confidenceLabel: toLabel(bestConfidence),
    },
    secondaryFit: second
      ? {
          environment: second[0],
          confidencePct: secondaryConfidence,
          confidenceLabel: toLabel(secondaryConfidence),
        }
      : null,
    breakdown,
    sufficientData,
  };
}

export interface CandidateInsightInput {
  references: { rating?: number }[];
  jobs: { start_date?: string; end_date?: string | null }[];
  peerConfirmedPct?: number;
}

/** Compute full insights payload (no tier trimming; that is done in API). */
export function computeInsights(input: CandidateInsightInput): WorkVouchInsightsPayload {
  const consistency = computeReferenceConsistency(input.references);
  const stability = computeStabilityIndex(input.jobs, input.peerConfirmedPct ?? 0);
  const environmentFit = computeEnvironmentFit(
    input.references,
    stability.level,
    consistency.label
  );
  return {
    reference_consistency: consistency,
    stability_index: stability,
    environment_fit_indicator: environmentFit,
  };
}

function cacheKey(candidateId: string): string {
  return `insights:${candidateId}`;
}

export function getCachedInsights(candidateId: string): WorkVouchInsightsPayload | null {
  const entry = cache.get(cacheKey(candidateId));
  if (!entry) return null;
  if (Date.now() - entry.ts > INSIGHTS_CACHE_TTL_MS) {
    cache.delete(cacheKey(candidateId));
    return null;
  }
  return entry.data;
}

export function setCachedInsights(
  candidateId: string,
  data: WorkVouchInsightsPayload
): void {
  cache.set(cacheKey(candidateId), { data, ts: Date.now() });
}
