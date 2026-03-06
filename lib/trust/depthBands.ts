/**
 * Trust graph depth score and band.
 * Algorithm: depthScore = direct_connections + (manager_connections * 2);
 * Band: 0–2 weak, 3–5 moderate, 6+ strong.
 *
 * Network depth band (connection count): minimal (<2), moderate (3–5), strong (6–10), exceptional (>10).
 */

export type DepthBand = "weak" | "moderate" | "strong";

export type NetworkDepthBand = "minimal" | "moderate" | "strong" | "exceptional";

export function toDepthBand(score: number): DepthBand {
  if (score <= 2) return "weak";
  if (score <= 5) return "moderate";
  return "strong";
}

/** Trust network depth band from connection count (Section 3 spec). */
export function toNetworkDepthBand(connectionCount: number): NetworkDepthBand {
  if (connectionCount < 2) return "minimal";
  if (connectionCount <= 5) return "moderate";
  if (connectionCount <= 10) return "strong";
  return "exceptional";
}

export function computeDepthScore(
  directConnections: number,
  managerConfirmations: number
): number {
  return directConnections + managerConfirmations * 2;
}
