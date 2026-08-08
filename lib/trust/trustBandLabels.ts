/** User-facing trust score band labels (0–100). Single source for UI + explain API. */
export function getTrustBandLabel(score: number): string {
  if (score < 40) return "Low";
  if (score < 60) return "Moderate";
  if (score < 80) return "Strong";
  return "Exceptional";
}
