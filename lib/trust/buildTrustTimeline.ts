import type { TrustEngineSnapshot } from "./types";

export type TrustTimelineItem = {
  id: string;
  type: string;
  message: string;
  impact: number;
};

/**
 * Build timeline from engine snapshot (single source of truth).
 * Returns events as timeline items for report/audit.
 */
export function buildTrustTimeline(snapshot: TrustEngineSnapshot): TrustTimelineItem[] {
  return snapshot.events.map((e, i) => ({
    id: `${i}`,
    type: e.type,
    message: e.message,
    impact: e.impact ?? 0,
  }));
}
