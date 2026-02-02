/**
 * Industry-specific weights for trust score components (0–1, sum = 1).
 * Used when employer views candidates; base trust_scores table keeps general (neutral) score.
 */

export type TrustScoreComponent =
  | "employment"
  | "tenure"
  | "rating"
  | "distribution"
  | "referenceVolume";

export type IndustryKey =
  | "security"
  | "healthcare"
  | "logistics"
  | "warehouse"
  | "retail"
  | "hospitality"
  | "law_enforcement";

export interface IndustryWeights {
  employment: number;
  tenure: number;
  rating: number;
  distribution: number;
  referenceVolume: number;
}

export const industryWeights: Record<IndustryKey, IndustryWeights> = {
  security: {
    employment: 0.2,
    tenure: 0.3,
    rating: 0.3,
    distribution: 0.1,
    referenceVolume: 0.1,
  },
  healthcare: {
    employment: 0.2,
    tenure: 0.3,
    rating: 0.3,
    distribution: 0.1,
    referenceVolume: 0.1,
  },
  logistics: {
    employment: 0.25,
    tenure: 0.2,
    rating: 0.25,
    distribution: 0.15,
    referenceVolume: 0.15,
  },
  warehouse: {
    employment: 0.25,
    tenure: 0.2,
    rating: 0.25,
    distribution: 0.15,
    referenceVolume: 0.15,
  },
  retail: {
    employment: 0.2,
    tenure: 0.15,
    rating: 0.35,
    distribution: 0.15,
    referenceVolume: 0.15,
  },
  hospitality: {
    employment: 0.2,
    tenure: 0.15,
    rating: 0.35,
    distribution: 0.15,
    referenceVolume: 0.15,
  },
  law_enforcement: {
    employment: 0.2,
    tenure: 0.35,
    rating: 0.3,
    distribution: 0.05,
    referenceVolume: 0.1,
  },
};

/** Core (neutral) weights for the single portable trust score. Sum = 1. No industry-specific stored score. */
export const coreWeights: IndustryWeights = {
  employment: 0.25,
  tenure: 0.25,
  rating: 0.25,
  distribution: 0.15,
  referenceVolume: 0.1,
};

/** @deprecated Use coreWeights. Kept for backward compatibility. */
export const generalWeights: IndustryWeights = coreWeights;
