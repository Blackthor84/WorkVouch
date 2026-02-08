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

function tenureStrength(totalMonths: number): number {
  const raw = Math.log(totalMonths + 1) * 10;
  return Math.min(raw, TS_CAP);
}

function reviewVolumeStrength(reviewCount: number): number {
  return Math.min(reviewCount * 3, RVS_CAP);
}

function sentimentStrength(sentimentAverage: number): number {
  return sentimentAverage * SS_SCALE;
}

function ratingStrength(averageRating: number): number {
  return ((averageRating - RS_NEUTRAL) / RS_DIVISOR) * RS_SCALE;
}

function rehireMultiplier(rehireEligible: boolean): number {
  return rehireEligible ? RM_ELIGIBLE : RM_NOT_ELIGIBLE;
}

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

/** Component breakdown for defensibility (admin-only). Same math as calculateV1. */
export interface V1Breakdown {
  totalScore: number;
  components: {
    tenure: number;
    reviewVolume: number;
    sentiment: number;
    rating: number;
    rehireMultiplier: number;
  };
}

export function calculateV1Breakdown(input: ProfileInput): V1Breakdown {
  const tenure = tenureStrength(input.totalMonths);
  const reviewVolume = reviewVolumeStrength(input.reviewCount);
  const sentiment = sentimentStrength(input.sentimentAverage);
  const rating = ratingStrength(input.averageRating);
  const rm = rehireMultiplier(input.rehireEligible);
  const rawScore = tenure + reviewVolume + sentiment + rating;
  const totalScore = Math.round(
    clamp(rawScore * rm, MIN_SCORE, MAX_SCORE)
  );
  return {
    totalScore,
    components: {
      tenure: Math.round(tenure * 100) / 100,
      reviewVolume: Math.round(reviewVolume * 100) / 100,
      sentiment: Math.round(sentiment * 100) / 100,
      rating: Math.round(rating * 100) / 100,
      rehireMultiplier: Math.round(rm * 100) / 100,
    },
  };
}
