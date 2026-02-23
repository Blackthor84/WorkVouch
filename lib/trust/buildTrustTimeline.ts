import type { TrustSnapshot } from "./types";
import type { TrustTimelineEvent } from "./types";

/**
 * Build a time-ordered list of trust snapshots from a base score and events.
 * Each event applies a delta; score is clamped 0–100.
 */
export function buildTrustTimeline(
  baseScore: number,
  events: TrustTimelineEvent[]
): TrustSnapshot[] {
  let score = baseScore;
  const timeline: TrustSnapshot[] = [];

  for (const e of events) {
    score += e.delta;
    timeline.push({
      timestamp: e.time,
      trustScore: Math.max(0, Math.min(100, score)),
      reason: e.reason,
    });
  }

  return timeline;
}
