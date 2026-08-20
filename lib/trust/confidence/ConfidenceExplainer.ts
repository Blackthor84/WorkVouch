import type { ConfidenceFactor, ConfidenceTimelinePoint } from "./types";
import { renderStarRating } from "./ConfidenceLevelResolver";

/** Builds human-readable confidence explanations — no black boxes. */
export class ConfidenceExplainer {
  buildExplanation(factors: ConfidenceFactor[], score: number, levelLabel: string): string[] {
    const lines: string[] = [];
    lines.push(`Hiring Confidence ${score}% — ${levelLabel}`);

    const positive = factors
      .filter((f) => f.status === "positive" && f.contribution > 0 && f.id !== "risk_signals")
      .sort((a, b) => b.contribution - a.contribution);

    for (const factor of positive.slice(0, 6)) {
      lines.push(`✓ ${factor.label} (+${factor.contribution})`);
    }

    const risk = factors.find((f) => f.id === "risk_signals");
    if (risk?.explanation) {
      lines.push(risk.explanation);
    } else if (risk?.status === "positive") {
      lines.push("No significant risk signals detected.");
    }

    const missing = factors.filter((f) => f.status === "missing" || f.status === "negative");
    for (const factor of missing.slice(0, 3)) {
      if (factor.contribution < 5) {
        lines.push(`○ ${factor.label} — additional data recommended`);
      }
    }

    return lines;
  }

  buildTimeline(
    score: number,
    milestones?: Array<{ id: string; label: string; completionPct: number; occurredAt?: string }>
  ): ConfidenceTimelinePoint[] {
    const ratios = [0.6, 0.79, 0.94, 1];
    const defaults = [
      { id: "imported", label: "Application Imported", ratio: ratios[0] },
      { id: "verification", label: "Verification Complete", ratio: ratios[1] },
      { id: "references", label: "References Complete", ratio: ratios[2] },
      { id: "trust", label: "Trust Updated", ratio: ratios[3] },
    ];

    const steps = milestones?.length
      ? milestones.map((m, i) => ({
          id: m.id,
          label: m.label,
          ratio: m.completionPct,
          occurredAt: m.occurredAt,
        }))
      : defaults;

    let prev = 0;
    return steps.map((step) => {
      const clamped = Math.max(prev, Math.round(score * step.ratio));
      const point: ConfidenceTimelinePoint = {
        id: step.id,
        label: step.label,
        confidenceScore: clamped,
        occurredAt: "occurredAt" in step ? step.occurredAt : undefined,
        delta: prev > 0 ? clamped - prev : undefined,
      };
      prev = clamped;
      return point;
    });
  }

  buildBadges(input: {
    score: number;
    employmentVerified: boolean;
    managerReferences: number;
    coworkerReferences: number;
    referenceConsensus: string;
    dataFreshnessHours: number | null;
  }): Array<{ id: string; label: string; earned: boolean }> {
    return [
      { id: "high_confidence", label: "High Confidence", earned: input.score >= 90 },
      { id: "verified_employment", label: "Verified Employment", earned: input.employmentVerified },
      { id: "verified_managers", label: "Verified Managers", earned: input.managerReferences >= 1 },
      { id: "verified_coworkers", label: "Verified Coworkers", earned: input.coworkerReferences >= 2 },
      {
        id: "strong_references",
        label: "Strong References",
        earned: input.referenceConsensus === "strong",
      },
      {
        id: "recently_verified",
        label: "Recently Verified",
        earned: input.dataFreshnessHours !== null && input.dataFreshnessHours <= 72,
      },
    ];
  }

  formatSummary(score: number, levelLabel: string, starRating: number): string {
    return `${score}% ${renderStarRating(starRating)} ${levelLabel}`;
  }
}
