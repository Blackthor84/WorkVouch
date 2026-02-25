import type { TrustEngineSnapshot, TrustTimelineEvent } from "./types";

/**
 * Build timeline from engine snapshot (single source of truth).
 * Prefers ledger (trustScore + reason); falls back to events (reason = message).
 */
export function buildTrustTimeline(snapshot: TrustEngineSnapshot): TrustTimelineEvent[] {
  if (snapshot.ledger.length > 0) {
    return snapshot.ledger.map((e, i) => ({
      id: `${i}`,
      trustScore: e.snapshot.trustScore,
      reason: e.action,
      timestamp: e.day,
    }));
  }
  return snapshot.events.map((e, i) => ({
    id: `${i}`,
    trustScore: 0,
    reason: e.message,
    type: e.type,
    message: e.message,
    impact: e.impact ?? 0,
  }));
}
