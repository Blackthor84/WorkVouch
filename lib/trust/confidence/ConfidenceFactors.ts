import type { ConfidenceFactor, ConfidenceFactorStatus, ConfidenceInput } from "./types";
import { CONFIDENCE_FACTOR_LABELS, CONFIDENCE_WEIGHTS } from "./ConfidenceWeights";

/** Builds individual confidence factors from aggregated input signals. */
export class ConfidenceFactors {
  build(input: ConfidenceInput): ConfidenceFactor[] {
    return [
      this.trustScore(input),
      this.employmentVerification(input),
      this.managerVerification(input),
      this.coworkerVerification(input),
      this.referenceConsensus(input),
      this.timelineConsistency(input),
      this.identityVerification(input),
      this.workflowCompletion(input),
      this.dataFreshness(input),
      this.missingInformation(input),
      this.riskSignals(input),
    ];
  }

  private trustScore(input: ConfidenceInput): ConfidenceFactor {
    const score = input.trustScore ?? 0;
    const normalized = score / 100;
    return this.factor("trust_score", normalized, input.trustScore ? "positive" : "missing", score > 0 ? 0.9 : 0.3);
  }

  private employmentVerification(input: ConfidenceInput): ConfidenceFactor {
    const normalized = input.employmentVerified
      ? Math.min(1, 0.6 + input.verifiedEmploymentCount * 0.2)
      : input.verifiedEmploymentCount > 0
        ? 0.4
        : 0;
    return this.factor(
      "employment_verification",
      normalized,
      input.employmentVerified ? "positive" : input.verifiedEmploymentCount > 0 ? "neutral" : "negative",
      input.employmentVerified ? 0.95 : 0.5
    );
  }

  private managerVerification(input: ConfidenceInput): ConfidenceFactor {
    const normalized = Math.min(1, input.managerReferences / 2);
    return this.factor(
      "manager_verification",
      normalized,
      input.managerReferences >= 1 ? "positive" : "missing",
      input.managerReferences >= 2 ? 0.92 : input.managerReferences === 1 ? 0.75 : 0.3
    );
  }

  private coworkerVerification(input: ConfidenceInput): ConfidenceFactor {
    const normalized = Math.min(1, input.coworkerReferences / 3);
    return this.factor(
      "coworker_verification",
      normalized,
      input.coworkerReferences >= 2 ? "positive" : input.coworkerReferences === 1 ? "neutral" : "missing",
      input.coworkerReferences >= 2 ? 0.9 : 0.4
    );
  }

  private referenceConsensus(input: ConfidenceInput): ConfidenceFactor {
    const map = { strong: 1, moderate: 0.65, weak: 0.35, unknown: 0.15 };
    const normalized = map[input.referenceConsensus] * (input.referenceCompletionPct / 100);
    return this.factor(
      "reference_consensus",
      normalized,
      input.referenceConsensus === "strong" ? "positive" : input.referenceConsensus === "unknown" ? "missing" : "neutral",
      input.referenceConsensus === "strong" ? 0.88 : 0.55
    );
  }

  private timelineConsistency(input: ConfidenceInput): ConfidenceFactor {
    const normalized = Math.max(0, Math.min(1, input.timelineConfidenceAvg));
    return this.factor(
      "timeline_consistency",
      normalized,
      normalized >= 0.8 ? "positive" : normalized >= 0.5 ? "neutral" : "negative",
      normalized >= 0.8 ? 0.9 : 0.6
    );
  }

  private identityVerification(input: ConfidenceInput): ConfidenceFactor {
    const normalized = input.employmentVerified ? 0.85 : 0.2;
    return this.factor(
      "identity_verification",
      normalized,
      input.employmentVerified ? "positive" : "missing",
      input.employmentVerified ? 0.8 : 0.35
    );
  }

  private workflowCompletion(input: ConfidenceInput): ConfidenceFactor {
    const normalized = input.workflowCompletionPct / 100;
    return this.factor(
      "workflow_completion",
      normalized,
      normalized >= 0.85 ? "positive" : normalized >= 0.5 ? "neutral" : "missing",
      normalized >= 0.85 ? 0.85 : 0.5
    );
  }

  private dataFreshness(input: ConfidenceInput): ConfidenceFactor {
    const hours = input.dataFreshnessHours;
    let normalized = 0.5;
    if (hours === null) normalized = 0.4;
    else if (hours <= 24) normalized = 1;
    else if (hours <= 72) normalized = 0.75;
    else if (hours <= 168) normalized = 0.5;
    else normalized = 0.25;

    return this.factor(
      "data_freshness",
      normalized,
      hours !== null && hours <= 72 ? "positive" : "neutral",
      hours !== null && hours <= 24 ? 0.9 : 0.6
    );
  }

  private missingInformation(input: ConfidenceInput): ConfidenceFactor {
    const missingCount = input.missingInformation.length;
    const normalized = Math.max(0, 1 - missingCount * 0.25);
    return this.factor(
      "missing_information",
      normalized,
      missingCount === 0 ? "positive" : missingCount <= 2 ? "neutral" : "negative",
      missingCount === 0 ? 0.95 : 0.5,
      missingCount > 0 ? `Missing: ${input.missingInformation.join(", ")}` : undefined
    );
  }

  private riskSignals(input: ConfidenceInput): ConfidenceFactor {
    const riskCount = input.fraudFlagsCount + (input.hasOpenDispute ? 2 : 0);
    const normalized = Math.max(0, 1 - riskCount * 0.35);
    return this.factor(
      "risk_signals",
      normalized,
      riskCount === 0 ? "positive" : "negative",
      riskCount === 0 ? 0.95 : 0.4,
      riskCount > 0 ? `${riskCount} risk signal(s) detected` : "No significant risk signals detected"
    );
  }

  private factor(
    id: ConfidenceFactor["id"],
    normalized: number,
    status: ConfidenceFactorStatus,
    confidence: number,
    explanation?: string
  ): ConfidenceFactor {
    const weight = CONFIDENCE_WEIGHTS[id];
    const contribution =
      id === "missing_information" || id === "risk_signals"
        ? Math.round(normalized * weight * 100)
        : Math.round(normalized * weight * 100);

    return {
      id,
      label: CONFIDENCE_FACTOR_LABELS[id],
      weight,
      contribution,
      confidence,
      status,
      explanation,
    };
  }
}
