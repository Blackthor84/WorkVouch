import type { TrustScoreComponents } from "@/lib/trustScore";
import type { TrustScoreFactor } from "./types";

/** Build explainability factors with weight, contribution, and confidence. */
export function buildTrustExplainability(
  score: number,
  components: TrustScoreComponents
): TrustScoreFactor[] {
  const factors: TrustScoreFactor[] = [];

  const employmentWeight = 0.25;
  const employmentVerified = components.verifiedEmployments > 0;
  factors.push({
    id: "employment_verified",
    label: "Employment Verified",
    weight: employmentWeight,
    contribution: employmentVerified ? employmentWeight * score : 0,
    confidence: employmentVerified ? 0.95 : 0.4,
    status: employmentVerified ? "positive" : "neutral",
  });

  const managerWeight = 0.2;
  const hasManagerSignal = components.uniqueEmployersWithReferences >= 1 && components.referenceCount > 0;
  factors.push({
    id: "manager_consensus",
    label: "Manager Consensus",
    weight: managerWeight,
    contribution: hasManagerSignal ? managerWeight * score * 0.85 : 0,
    confidence: hasManagerSignal ? 0.88 : 0.35,
    status: hasManagerSignal ? "positive" : "neutral",
  });

  const coworkerWeight = 0.2;
  const hasCoworker = components.referenceCount >= 2;
  factors.push({
    id: "coworker_consensus",
    label: "Coworker Consensus",
    weight: coworkerWeight,
    contribution: hasCoworker ? coworkerWeight * score * 0.9 : coworkerWeight * score * 0.3,
    confidence: hasCoworker ? 0.9 : components.referenceCount === 1 ? 0.6 : 0.3,
    status: components.referenceCount > 0 ? "positive" : "neutral",
  });

  const tenureWeight = 0.15;
  const tenureStrong = components.totalVerifiedYears >= 2;
  factors.push({
    id: "tenure_consistency",
    label: "Tenure Consistency",
    weight: tenureWeight,
    contribution: tenureStrong ? tenureWeight * score : tenureWeight * score * 0.4,
    confidence: tenureStrong ? 0.92 : components.totalVerifiedYears >= 1 ? 0.7 : 0.4,
    status: tenureStrong ? "positive" : "neutral",
  });

  const qualityWeight = 0.1;
  const qualityStrong = components.averageReferenceRating >= 4;
  factors.push({
    id: "reference_quality",
    label: "Reference Quality",
    weight: qualityWeight,
    contribution: qualityStrong ? qualityWeight * score : qualityWeight * score * 0.5,
    confidence: components.referenceCount > 0 ? 0.85 : 0.2,
    status: qualityStrong ? "positive" : components.referenceCount > 0 ? "neutral" : "neutral",
  });

  const identityWeight = 0.05;
  factors.push({
    id: "identity_verification",
    label: "Identity Verification",
    weight: identityWeight,
    contribution: employmentVerified ? identityWeight * score : 0,
    confidence: employmentVerified ? 0.8 : 0.3,
    status: employmentVerified ? "positive" : "neutral",
  });

  const riskWeight = 0.05;
  const noRisk = components.fraudFlagsCount === 0;
  factors.push({
    id: "risk_signals",
    label: "No Risk Signals",
    weight: riskWeight,
    contribution: noRisk ? riskWeight * score : 0,
    confidence: noRisk ? 0.95 : 0.5,
    status: noRisk ? "positive" : "negative",
  });

  return factors;
}

/** Demo explainability for marketplace preview. */
export function buildDemoExplainability(score: number): TrustScoreFactor[] {
  return buildTrustExplainability(score, {
    verifiedEmployments: 2,
    totalVerifiedYears: 4.5,
    averageReferenceRating: 4.7,
    referenceCount: 5,
    uniqueEmployersWithReferences: 2,
    fraudFlagsCount: 0,
  });
}
