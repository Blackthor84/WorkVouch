import type { TrustReport, TrustTimelineEvent } from "./types";

type TrustReportInput = {
  score: number;
  positives?: string[];
  flags?: string[];
  timeline?: TrustTimelineEvent[];
};

/**
 * Exportable trust report for enterprise (JSON now; PDF later).
 */
export function generateTrustReport(data: TrustReportInput): TrustReport {
  return {
    trustScore: data.score,
    strengths: data.positives ?? [],
    risks: data.flags ?? [],
    timeline: data.timeline ?? [],
    disclaimer: "Peer-based, non-deterministic verification",
  };
}
