/**
 * ROI Calculator Engine — quantifies financial impact of trust failures
 * from simulation outputs. CFO-safe industry defaults; enterprise can override.
 * Supports "Without WorkVouch" counterfactual for avoided-loss comparison.
 * Uses canonical WorkVouch industry set only (see @/lib/industries).
 */

import type { Industry } from "@/lib/industries";

export type DecisionType = "hire" | "reject" | "group_hire";

export type ConfidenceLevel = "low" | "medium" | "high";

/** Overridable assumptions (enterprise only). */
export interface ROIAssumptions {
  salary: number;
  badHireMultiplier: number;
  turnoverMultiplier: number;
  complianceProbability: number;
  averageCompliancePenalty: number;
  productivityLossRate: number;
  durationMonths: number;
  reputationRiskLow?: number;
  reputationRiskHigh?: number;
}

/** Per-industry conservative defaults (WorkVouch canonical set; documented, defensible). */
export const INDUSTRY_DEFAULTS: Record<
  Industry,
  {
    salary: number;
    badHireMultiplier: number;
    turnoverMultiplier: number;
    averageCompliancePenalty: number;
    baseIncidentProbability: number; // 0–1, scaled by simulation
    productivityLossRate: number;
    productivityLossDurationMonths: number;
    reputationRiskLow: number;
    reputationRiskHigh: number;
    notes: string;
  }
> = {
  retail: {
    salary: 42_000,
    badHireMultiplier: 1.0,
    turnoverMultiplier: 0.5,
    averageCompliancePenalty: 150_000,
    baseIncidentProbability: 0.04,
    productivityLossRate: 0.06,
    productivityLossDurationMonths: 4,
    reputationRiskLow: 10_000,
    reputationRiskHigh: 100_000,
    notes: "High turnover; theft and safety. Conservative estimates.",
  },
  education: {
    salary: 58_000,
    badHireMultiplier: 0.9,
    turnoverMultiplier: 0.45,
    averageCompliancePenalty: 400_000,
    baseIncidentProbability: 0.05,
    productivityLossRate: 0.05,
    productivityLossDurationMonths: 9,
    reputationRiskLow: 25_000,
    reputationRiskHigh: 250_000,
    notes: "Background checks, reputation, slow recovery.",
  },
  law_enforcement: {
    salary: 68_000,
    badHireMultiplier: 1.8,
    turnoverMultiplier: 0.7,
    averageCompliancePenalty: 1_200_000,
    baseIncidentProbability: 0.09,
    productivityLossRate: 0.08,
    productivityLossDurationMonths: 8,
    reputationRiskLow: 100_000,
    reputationRiskHigh: 1_000_000,
    notes: "High scrutiny, liability, and regulatory exposure.",
  },
  security: {
    salary: 48_000,
    badHireMultiplier: 1.4,
    turnoverMultiplier: 0.6,
    averageCompliancePenalty: 600_000,
    baseIncidentProbability: 0.07,
    productivityLossRate: 0.07,
    productivityLossDurationMonths: 6,
    reputationRiskLow: 50_000,
    reputationRiskHigh: 500_000,
    notes: "Licensing, liability, and client trust.",
  },
  warehouse_logistics: {
    salary: 45_000,
    badHireMultiplier: 1.1,
    turnoverMultiplier: 0.55,
    averageCompliancePenalty: 300_000,
    baseIncidentProbability: 0.05,
    productivityLossRate: 0.07,
    productivityLossDurationMonths: 4,
    reputationRiskLow: 15_000,
    reputationRiskHigh: 150_000,
    notes: "Safety, theft, and operational disruption.",
  },
  healthcare: {
    salary: 72_000,
    badHireMultiplier: 1.5,
    turnoverMultiplier: 0.7,
    averageCompliancePenalty: 750_000,
    baseIncidentProbability: 0.08,
    productivityLossRate: 0.08,
    productivityLossDurationMonths: 6,
    reputationRiskLow: 50_000,
    reputationRiskHigh: 500_000,
    notes: "Patient safety, licensing, regulator scrutiny.",
  },
  hospitality: {
    salary: 38_000,
    badHireMultiplier: 0.9,
    turnoverMultiplier: 0.5,
    averageCompliancePenalty: 120_000,
    baseIncidentProbability: 0.035,
    productivityLossRate: 0.06,
    productivityLossDurationMonths: 4,
    reputationRiskLow: 15_000,
    reputationRiskHigh: 120_000,
    notes: "High churn; guest safety and reputation.",
  },
  skilled_trades: {
    salary: 62_000,
    badHireMultiplier: 1.2,
    turnoverMultiplier: 0.55,
    averageCompliancePenalty: 350_000,
    baseIncidentProbability: 0.045,
    productivityLossRate: 0.06,
    productivityLossDurationMonths: 5,
    reputationRiskLow: 20_000,
    reputationRiskHigh: 200_000,
    notes: "Certifications, safety, and project delivery.",
  },
  construction: {
    salary: 58_000,
    badHireMultiplier: 1.2,
    turnoverMultiplier: 0.6,
    averageCompliancePenalty: 450_000,
    baseIncidentProbability: 0.05,
    productivityLossRate: 0.07,
    productivityLossDurationMonths: 5,
    reputationRiskLow: 25_000,
    reputationRiskHigh: 250_000,
    notes: "Safety, bonding, and schedule risk.",
  },
};

export function getDefaultAssumptions(industry: Industry): ROIAssumptions {
  const d = INDUSTRY_DEFAULTS[industry];
  return {
    salary: d.salary,
    badHireMultiplier: d.badHireMultiplier,
    turnoverMultiplier: d.turnoverMultiplier,
    complianceProbability: d.baseIncidentProbability,
    averageCompliancePenalty: d.averageCompliancePenalty,
    productivityLossRate: d.productivityLossRate,
    durationMonths: d.productivityLossDurationMonths,
    reputationRiskLow: d.reputationRiskLow,
    reputationRiskHigh: d.reputationRiskHigh,
  };
}

/** Single cost line item with assumption and confidence. */
export interface ROICostItem {
  category: string;
  value: number;
  assumption: string;
  confidence: ConfidenceLevel;
  /** Which simulation output or event drove this cost (for audit/explainability). */
  triggerDescription?: string;
}

/** Inputs derived from simulation state. */
export interface ROIEngineInputs {
  industry: Industry;
  populationSize: number;
  trustCollapseEvents: number;
  forceHireOrOverrideUsage: number;
  fragilityScore: number;
  trustDebtLevel: number;
  decisionType: DecisionType;
  teamSize?: number;
}

export interface ROIEngineResult {
  totalEstimatedExposure: number;
  breakdown: ROICostItem[];
  assumptions: ROIAssumptions;
  confidence: ConfidenceLevel;
  hasMaterialRisk: boolean;
  /** Optional: step at which collapse was detected (for comparison copy). */
  collapseDetectedAtStep?: number;
  populationAffected?: number;
}

type OutputsLike = { trustScore: number; complianceScore: number; fragilityScore: number; trustDebt: number } | null;

/**
 * Scale base incident probability using simulation outputs (trust collapse, fragility, debt, overrides, population).
 */
function scaleComplianceProbability(
  baseP: number,
  inputs: ROIEngineInputs,
  outputs: OutputsLike
): number {
  let p = baseP;
  if (inputs.trustCollapseEvents > 0) p = Math.min(1, p * (1 + 0.5 * inputs.trustCollapseEvents));
  if (outputs) {
    if (outputs.fragilityScore > 60) p = Math.min(1, p * (1 + (outputs.fragilityScore - 60) / 100));
    if (outputs.trustDebt > 30) p = Math.min(1, p * (1 + outputs.trustDebt / 200));
  }
  if (inputs.forceHireOrOverrideUsage > 0) p = Math.min(1, p * 1.2);
  if (inputs.populationSize > 5) p = Math.min(1, p * (1 + Math.log(inputs.populationSize) / 10));
  return Math.min(1, p);
}

export function hasMaterialTrustFailure(inputs: ROIEngineInputs, outputs: OutputsLike): boolean {
  if (!outputs) return false;
  if (inputs.trustCollapseEvents > 0 || inputs.forceHireOrOverrideUsage > 0) return true;
  if (outputs.complianceScore < 60) return true;
  if (outputs.trustScore < 40) return true;
  if (outputs.fragilityScore > 70) return true;
  if (outputs.trustDebt > 50) return true;
  return false;
}

function confidenceFromInputs(inputs: ROIEngineInputs, outputs: OutputsLike): ConfidenceLevel {
  if (!outputs) return "low";
  if (inputs.trustCollapseEvents > 0 || inputs.forceHireOrOverrideUsage > 0) return "medium";
  if (inputs.populationSize > 10) return "medium";
  return "high";
}

/**
 * Compute estimated financial exposure (with WorkVouch controls).
 */
export function computeROI(
  inputs: ROIEngineInputs,
  assumptions: ROIAssumptions,
  outputs: OutputsLike
): ROIEngineResult {
  const hasRisk = hasMaterialTrustFailure(inputs, outputs);
  const confidence = confidenceFromInputs(inputs, outputs);
  const breakdown: ROICostItem[] = [];
  const teamSize = inputs.teamSize ?? inputs.populationSize;
  const scaledComplianceP = scaleComplianceProbability(assumptions.complianceProbability, inputs, outputs);

  if (!hasRisk) {
    return {
      totalEstimatedExposure: 0,
      breakdown: [],
      assumptions,
      confidence: "high",
      hasMaterialRisk: false,
      populationAffected: inputs.populationSize,
    };
  }

  const badHireCount = Math.min(1, inputs.forceHireOrOverrideUsage) + (inputs.decisionType === "group_hire" ? Math.min(inputs.populationSize, 5) : 0);
  const badHireCost = badHireCount * assumptions.salary * Math.max(0.3, Math.min(2, assumptions.badHireMultiplier));
  breakdown.push({
    category: "Bad hire",
    value: badHireCost,
    assumption: `${badHireCount} × $${assumptions.salary.toLocaleString()} × ${assumptions.badHireMultiplier}`,
    confidence,
    triggerDescription: inputs.forceHireOrOverrideUsage > 0 ? "Force hire / override usage" : inputs.trustCollapseEvents > 0 ? "Trust collapse events" : "Material risk from trust/compliance/fragility/debt",
  });

  const turnoverEmployees = Math.min(inputs.populationSize, Math.max(0, Math.floor(inputs.populationSize * (inputs.trustCollapseEvents > 0 ? 0.2 : 0.05))));
  const turnoverCost = turnoverEmployees * assumptions.salary * assumptions.turnoverMultiplier;
  breakdown.push({
    category: "Turnover",
    value: turnoverCost,
    assumption: `${turnoverEmployees} × $${assumptions.salary.toLocaleString()} × ${assumptions.turnoverMultiplier}`,
    confidence,
    triggerDescription: inputs.trustCollapseEvents > 0 ? "Trust collapse events (elevated turnover rate)" : "Population size and base turnover rate",
  });

  const complianceCost = scaledComplianceP * assumptions.averageCompliancePenalty;
  breakdown.push({
    category: "Compliance / regulatory risk",
    value: complianceCost,
    assumption: `P=${scaledComplianceP.toFixed(2)} × $${assumptions.averageCompliancePenalty.toLocaleString()}`,
    confidence: outputs && outputs.complianceScore < 60 ? "medium" : "low",
  });

  const productivityCost = teamSize * assumptions.salary * assumptions.productivityLossRate * (assumptions.durationMonths / 12);
  breakdown.push({
    category: "Productivity loss",
    value: productivityCost,
    assumption: `${teamSize} × $${assumptions.salary.toLocaleString()} × ${assumptions.productivityLossRate} × ${assumptions.durationMonths}/12 mo`,
    confidence,
    triggerDescription: "Material risk present → productivity/culture loss applied to team size and duration",
  });

  if (assumptions.reputationRiskLow != null && assumptions.reputationRiskHigh != null) {
    const repMid = (assumptions.reputationRiskLow + assumptions.reputationRiskHigh) / 2;
    breakdown.push({
      category: "Reputation risk (est.)",
      value: repMid,
      assumption: `Range $${assumptions.reputationRiskLow.toLocaleString()}–$${assumptions.reputationRiskHigh.toLocaleString()}`,
      confidence: "low",
      triggerDescription: "Industry reputation range (expected value); material risk scenario",
    });
  }

  const totalEstimatedExposure = breakdown.reduce((sum, i) => sum + i.value, 0);

  return {
    totalEstimatedExposure,
    breakdown,
    assumptions,
    confidence,
    hasMaterialRisk: true,
    populationAffected: inputs.populationSize,
  };
}

/** "Without WorkVouch" baseline multipliers (no rewind, no intent modeling, no audit, later detection, wider blast radius). */
const COUNTERFACTUAL_MULTIPLIERS = {
  complianceProbability: 1.4,   // +40%
  populationAffected: 1.25,     // +25%
  turnoverDurationMonths: 2,    // +2 months
  detectionLagSteps: 3,         // ~2–4 steps later → model as more population/impact
};

/**
 * Build assumptions for the counterfactual "Without WorkVouch" scenario.
 */
function counterfactualAssumptions(assumptions: ROIAssumptions, inputs: ROIEngineInputs): ROIAssumptions {
  return {
    ...assumptions,
    complianceProbability: Math.min(1, assumptions.complianceProbability * COUNTERFACTUAL_MULTIPLIERS.complianceProbability),
    durationMonths: assumptions.durationMonths + COUNTERFACTUAL_MULTIPLIERS.turnoverDurationMonths,
  };
}

/**
 * Build inputs for the counterfactual: larger population affected, no early detection.
 */
function counterfactualInputs(inputs: ROIEngineInputs, currentStep: number): ROIEngineInputs {
  const inflatedPopulation = Math.max(1, Math.ceil(inputs.populationSize * COUNTERFACTUAL_MULTIPLIERS.populationAffected));
  return {
    ...inputs,
    populationSize: inflatedPopulation,
    teamSize: inflatedPopulation,
    // Model detection lag: collapse "detected" later → more turnover/compliance exposure
    trustCollapseEvents: inputs.trustCollapseEvents > 0 ? inputs.trustCollapseEvents + COUNTERFACTUAL_MULTIPLIERS.detectionLagSteps : 0,
  };
}

export interface ROICounterfactualResult {
  withWorkVouch: ROIEngineResult;
  withoutWorkVouch: ROIEngineResult;
  avoidedLoss: number;
  collapseDetectedWithAtStep?: number;
  collapseDetectedWithoutAtStep?: number;
  populationWith: number;
  populationWithout: number;
}

/**
 * Run ROI with and without WorkVouch; return comparison and avoided loss.
 */
export function computeROIComparison(
  inputs: ROIEngineInputs,
  assumptions: ROIAssumptions,
  outputs: OutputsLike,
  currentStep: number
): ROICounterfactualResult {
  const withResult = computeROI(inputs, assumptions, outputs);
  const cfInputs = counterfactualInputs(inputs, currentStep);
  const cfAssumptions = counterfactualAssumptions(assumptions, cfInputs);
  const withoutResult = computeROI(cfInputs, cfAssumptions, outputs);

  const withTotal = withResult.totalEstimatedExposure;
  const withoutTotal = withoutResult.totalEstimatedExposure;
  const avoidedLoss = Math.max(0, withoutTotal - withTotal);

  return {
    withWorkVouch: withResult,
    withoutWorkVouch: withoutResult,
    avoidedLoss,
    collapseDetectedWithAtStep: withResult.hasMaterialRisk ? currentStep : undefined,
    collapseDetectedWithoutAtStep: withoutResult.hasMaterialRisk ? currentStep + COUNTERFACTUAL_MULTIPLIERS.detectionLagSteps : undefined,
    populationWith: inputs.populationSize,
    populationWithout: cfInputs.populationSize,
  };
}
