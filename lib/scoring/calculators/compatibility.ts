import { ScoreResult } from "../types";

export function calculateCompatibility(weights: Record<string, number>, metrics: Record<string, number>): ScoreResult {
  let score = 0;
  const breakdown: Record<string, number> = {};

  Object.keys(weights).forEach((key) => {
    const value = (metrics[key] ?? 0) * weights[key];
    breakdown[key] = value;
    score += value;
  });

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    breakdown,
  };
}
