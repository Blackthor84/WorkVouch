/**
 * Silent background network metrics. Not rendered anywhere.
 * Run when verification completes; store in profiles JSONB/NUMERIC columns.
 */

export interface ReferenceEdge {
  fromUserId: string;
  toUserId: string;
  respondedAt?: string;
  requestedAt?: string;
}

export interface NetworkInput {
  userId: string;
  references: ReferenceEdge[];
  totalPossibleReferences: number;
}

/**
 * Network density: proportion of possible reference edges that exist (0–1 scale).
 * Caller can store as NUMERIC (e.g. 0.0–1.0) in profiles.network_density.
 */
export function calculateNetworkDensity(input: NetworkInput): number {
  const { references, totalPossibleReferences } = input;
  if (totalPossibleReferences <= 0) return 0;
  const actual = references?.length ?? 0;
  return Math.round((actual / totalPossibleReferences) * 1000) / 1000;
}

/**
 * Detects suspicious clusters (e.g. many references in very short time).
 * Returns a fraud signal 0–1. Higher = more suspicious. Store in profiles.fraud_signal_score.
 */
export function detectSuspiciousClusters(input: NetworkInput): number {
  const { references } = input;
  if (!references || references.length === 0) return 0;
  const withTime = references.filter((r) => r.respondedAt || r.requestedAt);
  if (withTime.length < 2) return 0;
  const times = withTime
    .map((r) => {
      const t = r.respondedAt || r.requestedAt;
      return t ? new Date(t).getTime() : 0;
    })
    .filter((t) => t > 0)
    .sort((a, b) => a - b);
  if (times.length < 2) return 0;
  const windowMs = 60 * 60 * 1000; // 1 hour
  let maxInWindow = 1;
  for (let i = 0; i < times.length; i++) {
    let count = 1;
    for (let j = i + 1; j < times.length && times[j] - times[i] <= windowMs; j++) count++;
    maxInWindow = Math.max(maxInWindow, count);
  }
  const clusterRatio = maxInWindow / times.length;
  return Math.round(Math.min(1, clusterRatio * 0.5) * 1000) / 1000;
}

/**
 * Reference velocity: references per month (rate of response).
 * Store in profiles.reference_velocity.
 */
export function calculateReferenceVelocity(input: NetworkInput): number {
  const { references } = input;
  if (!references || references.length === 0) return 0;
  const withTime = references.filter((r) => r.respondedAt || r.requestedAt);
  if (withTime.length === 0) return 0;
  const times = withTime
    .map((r) => new Date(r.respondedAt || r.requestedAt!).getTime())
    .filter((t) => !isNaN(t));
  if (times.length === 0) return 0;
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanMonths = (maxT - minT) / (30.44 * 24 * 60 * 60 * 1000) || 1;
  const velocity = times.length / Math.max(0.1, spanMonths);
  return Math.round(velocity * 100) / 100;
}
