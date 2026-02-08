/**
 * WorkVouch Intelligence Engine — v1.
 * Canonical scoring algorithm. Pure function, no side effects.
 * See docs/workvouch-intelligence-v1.md.
 */

import type { ProfileInput } from "./types";

const TS_CAP = 30;
const RVS_CAP = 25;
const SS_SCALE = 20;
const RS_NEUTRAL = 3;
const RS_DIVISOR = 2;
const RS_SCALE = 15;
const RM_ELIGIBLE = 1.1;
const RM_NOT_ELIGIBLE = 0.9;
const MIN_SCORE = 0;
const MAX_SCORE = 100;

function clamp(x: number, min: number, max: number): number {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

/**
 * Tenure Strength: log(total_months + 1) * 10, cap at 30.
 */
function tenureStrength(totalMonths: number): number {
  const raw = Math.log(totalMonths + 1) * 10;
  return Math.min(raw, TS_CAP);
}

/**
 * Review Volume Strength: min(review_count * 3, 25).
 */
function reviewVolumeStrength(reviewCount: number): number {
  return Math.min(reviewCount * 3, RVS_CAP);
}

/**
 * Sentiment Strength: sentiment_average * 20, range -20 to +20.
 */
function sentimentStrength(sentimentAverage: number): number {
  return sentimentAverage * SS_SCALE;
}

/**
 * Rating Strength: ((average_rating - 3) / 2) * 15, range -15 to +15.
 */
function ratingStrength(averageRating: number): number {
  return ((averageRating - RS_NEUTRAL) / RS_DIVISOR) * RS_SCALE;
}

/**
 * Rehire Multiplier: 1.1 if rehire_eligible else 0.9.
 */
function rehireMultiplier(rehireEligible: boolean): number {
  return rehireEligible ? RM_ELIGIBLE : RM_NOT_ELIGIBLE;
}

/**
 * Calculate v1 employment confidence score (0–100).
 * RawScore = TS + RVS + SS + RS
 * FinalScore = clamp(RawScore * RM, 0, 100)
 * Returns rounded integer.
 */
export function calculateV1(input: ProfileInput): number {
  const ts = tenureStrength(input.totalMonths);
  const rvs = reviewVolumeStrength(input.reviewCount);
  const ss = sentimentStrength(input.sentimentAverage);
  const rs = ratingStrength(input.averageRating);
  const rawScore = ts + rvs + ss + rs;
  const rm = rehireMultiplier(input.rehireEligible);
  const finalScore = clamp(rawScore * rm, MIN_SCORE, MAX_SCORE);
  return Math.round(finalScore);
}
