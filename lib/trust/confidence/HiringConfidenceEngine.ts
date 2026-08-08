import { nowIso } from "@/lib/integrations/utils/correlation";
import { ConfidenceCalculator } from "./ConfidenceCalculator";
import { ConfidenceExplainer } from "./ConfidenceExplainer";
import { ConfidenceFactors } from "./ConfidenceFactors";
import { ConfidenceLevelResolver } from "./ConfidenceLevelResolver";
import type { ConfidenceInput, HiringConfidenceResult } from "./types";

/** Presentation layer — aggregates existing trust/verification data into hiring confidence. */
export class HiringConfidenceEngine {
  private readonly factors = new ConfidenceFactors();
  private readonly calculator = new ConfidenceCalculator();
  private readonly resolver = new ConfidenceLevelResolver();
  private readonly explainer = new ConfidenceExplainer();

  /** Compute hiring confidence from pre-built input (sync, testable). */
  computeFromInput(input: ConfidenceInput): HiringConfidenceResult {
    const confidenceFactors = this.factors.build(input);
    const confidenceScore = this.calculator.calculate(confidenceFactors);
    const { level, label, starRating } = this.resolver.resolve(confidenceScore);
    const { recommendation, label: recommendationLabel } = this.resolver.resolveRecommendation(
      confidenceScore,
      input
    );

    const confidenceBadges = this.explainer.buildBadges({
      score: confidenceScore,
      employmentVerified: input.employmentVerified,
      managerReferences: input.managerReferences,
      coworkerReferences: input.coworkerReferences,
      referenceConsensus: input.referenceConsensus,
      dataFreshnessHours: input.dataFreshnessHours,
    });

    return {
      confidenceScore,
      confidenceLevel: level,
      confidenceLevelLabel: label,
      starRating,
      confidenceFactors,
      confidenceTimeline: this.explainer.buildTimeline(confidenceScore, input.workflowMilestones),
      confidenceBadges,
      confidenceExplanation: this.explainer.buildExplanation(confidenceFactors, confidenceScore, label),
      recommendation,
      recommendationLabel,
      trustScore: input.trustScore,
      calculatedAt: nowIso(),
    };
  }

  /** Load existing data for a profile and compute hiring confidence. */
  async computeForProfile(profileId: string): Promise<HiringConfidenceResult> {
    const { loadProfileConfidenceInput } = await import("./profile-loader");
    const input = await loadProfileConfidenceInput(profileId);
    return this.computeFromInput(input);
  }

  /** Build confidence from Greenhouse panel aggregate data. */
  computeFromPanelSignals(signals: {
    trustScore: number | null;
    employmentVerified: boolean;
    managerReferences: number;
    coworkerReferences: number;
    referenceCompletionPct: number;
    referenceConsensus: "strong" | "moderate" | "weak" | "unknown";
    timelineConfidenceAvg: number;
    workflowCompletionPct: number;
    dataFreshnessHours?: number | null;
    workflowMilestones?: ConfidenceInput["workflowMilestones"];
  }): HiringConfidenceResult {
    const missing: string[] = [];
    if (!signals.trustScore) missing.push("trust score");
    if (!signals.employmentVerified) missing.push("employment verification");
    if (signals.managerReferences + signals.coworkerReferences === 0) missing.push("references");

    return this.computeFromInput({
      trustScore: signals.trustScore,
      verifiedEmploymentCount: signals.employmentVerified ? 1 : 0,
      employmentVerified: signals.employmentVerified,
      totalVerifiedYears: signals.employmentVerified ? 2 : 0,
      managerReferences: signals.managerReferences,
      coworkerReferences: signals.coworkerReferences,
      referenceCompletionPct: signals.referenceCompletionPct,
      referenceConsensus: signals.referenceConsensus,
      averageReferenceRating: 4,
      timelineConfidenceAvg: signals.timelineConfidenceAvg,
      workflowCompletionPct: signals.workflowCompletionPct,
      dataFreshnessHours: signals.dataFreshnessHours ?? null,
      fraudFlagsCount: 0,
      hasOpenDispute: false,
      missingInformation: missing,
      workflowMilestones: signals.workflowMilestones,
    });
  }
}

export const hiringConfidenceEngine = new HiringConfidenceEngine();
