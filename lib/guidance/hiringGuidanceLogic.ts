/**
 * Plain-language hiring guidance — no internal jargon in returned strings.
 */

export type InsightBand = "good" | "medium" | "risky";
export type RiskLevel = "low" | "medium" | "high";

export function normalizeConfidence(confidence?: string | number | null): number {
  if (typeof confidence === "number" && !Number.isNaN(confidence)) {
    return Math.min(100, Math.max(0, confidence));
  }
  const s = String(confidence ?? "").toUpperCase();
  if (s.includes("HIGH")) return 75;
  if (s.includes("LOW")) return 35;
  return 55;
}

export function riskFromSignals(
  trust: number,
  confidencePct: number,
  verificationCount = 0
): RiskLevel {
  if (trust < 55 || confidencePct < 38 || verificationCount === 0) return "high";
  if (trust >= 78 && confidencePct >= 58 && verificationCount >= 2) return "low";
  return "medium";
}

export function insightBand(
  trust: number,
  confidencePct: number,
  risk: RiskLevel
): InsightBand {
  if (risk === "high" || trust < 52) return "risky";
  if (risk === "low" && trust >= 72 && confidencePct >= 55) return "good";
  return "medium";
}

export function smartInsightMessage(band: InsightBand): string {
  switch (band) {
    case "good":
      return "Strong candidate with verified experience and consistent feedback.";
    case "medium":
      return "Solid background, but additional verification would improve confidence.";
    default:
      return "Limited verification and inconsistent signals — review before proceeding.";
  }
}

export function suggestedActions(args: {
  band: InsightBand;
  risk: RiskLevel;
  trust: number;
  confidencePct: number;
  referenceCount: number;
  supervisorVerificationHint?: boolean;
  candidateId?: string;
}): { label: string; href?: string; primary?: boolean }[] {
  const out: { label: string; href?: string; primary?: boolean }[] = [];
  const id = args.candidateId;

  if (args.risk !== "low" || args.referenceCount < 2) {
    out.push({
      label: "Request supervisor verification",
      href: id ? `/employer/candidates/${id}?intent=references` : undefined,
    });
  }
  if (args.referenceCount < 2) {
    out.push({
      label: "Ask for additional references",
      href: id ? `/employer/candidates/${id}?intent=references` : undefined,
    });
  }
  if (args.band === "risky" || args.trust < 65) {
    out.push({ label: "Review employment gaps" });
  }
  if (args.band === "good" && args.risk === "low") {
    out.push({ label: "Safe to move to interview stage", primary: true });
  } else if (out.length < 3) {
    out.push({ label: "Open full profile to verify details", href: id ? `/employer/candidates/${id}` : undefined });
  }

  const seen = new Set<string>();
  return out.filter((x) => {
    if (seen.has(x.label)) return false;
    seen.add(x.label);
    return true;
  }).slice(0, 4);
}

export function whyOutcomeLines(args: {
  trust: number;
  confidencePct: number;
  referenceCount: number;
  jobCount: number;
  peerSignalsStrong: boolean;
  gapsFlagged: boolean;
}): string[] {
  const lines: string[] = [];
  if (args.referenceCount >= 2) {
    lines.push("Multiple supervisor or peer verifications support this trust level.");
  } else if (args.referenceCount === 1) {
    lines.push("At least one verification is strengthening this profile.");
  }
  if (args.peerSignalsStrong) {
    lines.push("Peer feedback looks consistent and recent.");
  }
  if (args.jobCount >= 2 && !args.gapsFlagged) {
    lines.push("Work history reads steady with no flagged timeline gaps here.");
  }
  if (args.confidencePct >= 60) {
    lines.push("Confidence is supported by enough recent signals.");
  }
  if (lines.length === 0) {
    lines.push("Outcomes reflect the verification and history visible on this profile.");
  }
  return lines.slice(0, 4);
}

export function improvementHints(args: {
  trust: number;
  confidencePct: number;
  referenceCount: number;
}): string[] {
  const hints: string[] = [];
  if (args.referenceCount < 2) {
    hints.push("Add 1 supervisor verification → typically raises trust noticeably.");
  }
  if (args.confidencePct < 60) {
    hints.push("Add a recent peer review → helps confidence more than older signals.");
  }
  if (args.trust < 70) {
    hints.push("Complete any missing roles on the timeline → reduces unknowns.");
  }
  if (hints.length === 0) {
    hints.push("Keep verifications current to maintain strong confidence.");
  }
  return hints.slice(0, 3);
}
