/**
 * Pure helpers for CSV report data. No browser APIs.
 * For triggering downloads (document/Blob/URL), use @/lib/client/exportCSV.
 */

import type { ROIEngineResult, ROICounterfactualResult } from "@/lib/roi/ROICalculatorEngine";
import { getIndustryContextForExport } from "@/lib/industries/industryContext";
import { ALL_INDUSTRIES } from "@/lib/industries";
import type { Industry } from "@/lib/industries";
import { getEnterpriseRecommendedMonthlyPrice } from "@/lib/pricing/enterprise";

function isIndustry(s: string): s is Industry {
  return (ALL_INDUSTRIES as readonly string[]).includes(s);
}

export type ScenarioResultRow = {
  employee: string;
  trust_before: number;
  trust_after: number;
  delta: number;
};

export function scenarioReport(
  scenario: { name?: string },
  results: { name: string; before: { trustScore: number }; after: { trustScore: number } }[]
): ScenarioResultRow[] {
  return results.map((r) => ({
    employee: r.name,
    trust_before: r.before.trustScore,
    trust_after: r.after.trustScore,
    delta: r.after.trustScore - r.before.trustScore,
  }));
}

/** Scenario report with SIMULATION watermark row appended (Part F: exports watermarked). */
export function scenarioReportWithWatermark(
  scenario: { name?: string },
  results: { name: string; before: { trustScore: number }; after: { trustScore: number } }[]
): Record<string, unknown>[] {
  const rows = scenarioReport(scenario, results).map((r) => ({
    employee: r.employee,
    trust_before: r.trust_before,
    trust_after: r.trust_after,
    delta: r.delta,
  }));
  rows.push({
    employee: "[SIMULATION]",
    trust_before: "",
    trust_after: "",
    delta: "This export is from the Employee Outcome Designer. All data simulated. No real employee records modified.",
  });
  return rows;
}

const CSV_EMPTY = "";

/** ROI section rows for CSV append; same column set as scenario rows. Optional counterfactual adds With/Without and avoided loss. Optional industry documents assumptions used. includeEnterprisePricing: when false, methodology omits enterprise price reference (gated). */
export function roiSectionRows(
  roiResult: ROIEngineResult | null,
  comparison?: ROICounterfactualResult | null,
  industry?: string,
  includeEnterprisePricing?: boolean
): Record<string, unknown>[] {
  const empty = { employee: CSV_EMPTY, trust_before: CSV_EMPTY, trust_after: CSV_EMPTY, delta: CSV_EMPTY };
  if (!roiResult || !roiResult.hasMaterialRisk) {
    const base: Record<string, unknown>[] = [
      { ...empty, section: "ROI", metric: "Material risk", value: "No significant financial exposure detected", assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: CSV_EMPTY },
    ];
    if (industry) {
      base.push({ ...empty, section: "ROI", metric: "Industry (assumptions)", value: industry, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: "Conservative, industry-based estimates." });
      if (isIndustry(industry)) base.push({ ...empty, section: "ROI", metric: "Industry Context", value: CSV_EMPTY, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: getIndustryContextForExport(industry) + " All figures in this report are estimates from simulation." });
    }
    base.push({ ...empty, section: "SIMULATION", metric: CSV_EMPTY, value: CSV_EMPTY, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: "This report is watermarked SIMULATION. All figures are estimates." });
    return base;
  }
  const rows: Record<string, unknown>[] = [];
  if (industry) {
    rows.push({ ...empty, section: "ROI", metric: "Industry (assumptions)", value: industry, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: "Conservative, industry-based estimates." });
    if (isIndustry(industry)) rows.push({ ...empty, section: "ROI", metric: "Industry Context", value: CSV_EMPTY, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: getIndustryContextForExport(industry) + " All figures in this report are estimates from simulation." });
  }
  rows.push({ ...empty, section: "ROI", metric: "With WorkVouch — total exposure", value: roiResult.totalEstimatedExposure, assumption: CSV_EMPTY, confidence: roiResult.confidence, note: CSV_EMPTY });
  rows.push(...roiResult.breakdown.map((b) => ({ ...empty, section: "ROI", metric: b.category, value: b.value, assumption: b.assumption, confidence: b.confidence, note: CSV_EMPTY })));
  if (comparison) {
    rows.push(
      { ...empty, section: "ROI", metric: "Without WorkVouch — total exposure", value: comparison.withoutWorkVouch.totalEstimatedExposure, assumption: CSV_EMPTY, confidence: comparison.withoutWorkVouch.confidence, note: CSV_EMPTY },
      { ...empty, section: "ROI", metric: "Avoided loss", value: comparison.avoidedLoss, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: "Estimated avoided loss due to earlier detection, rewind, intent modeling." }
    );
  }
  const methodologyNote =
    "Industry defaults. Bad hire: salary × multiplier. Turnover: salary × turnover mult × affected. Compliance: P × penalty (P scaled by collapse, fragility, debt). Productivity: team × salary × loss × duration/12. Counterfactual: +40% compliance P, +25% population, +2 mo duration." +
    (includeEnterprisePricing !== false && industry && isIndustry(industry)
      ? ` Enterprise risk-adjusted value reference for this industry: $${getEnterpriseRecommendedMonthlyPrice(industry).toLocaleString()}/month (for ROI alignment).`
      : "");
  rows.push(
    { ...empty, section: "SIMULATION", metric: CSV_EMPTY, value: CSV_EMPTY, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: "This report is watermarked SIMULATION. All figures are estimates, not guarantees." },
    { ...empty, section: "Methodology", metric: CSV_EMPTY, value: CSV_EMPTY, assumption: CSV_EMPTY, confidence: CSV_EMPTY, note: methodologyNote }
  );
  return rows;
}

/** Scenario report with optional ROI appendix (and optional counterfactual). industry documents assumptions used in export. includeEnterprisePricing: when false, omits enterprise price reference (gated). */
export function scenarioReportWithROI(
  scenario: { name?: string },
  results: { name: string; before: { trustScore: number }; after: { trustScore: number } }[],
  roiResult: ROIEngineResult | null,
  roiComparison?: ROICounterfactualResult | null,
  industry?: string,
  includeEnterprisePricing?: boolean
): Record<string, unknown>[] {
  const scenarioRows = scenarioReport(scenario, results).map((r) => ({
    employee: r.employee,
    trust_before: r.trust_before,
    trust_after: r.trust_after,
    delta: r.delta,
    section: CSV_EMPTY,
    metric: CSV_EMPTY,
    value: CSV_EMPTY,
    assumption: CSV_EMPTY,
    confidence: CSV_EMPTY,
    note: CSV_EMPTY,
  }));
  const roiRows = roiSectionRows(roiResult, roiComparison, industry, includeEnterprisePricing);
  return [...scenarioRows, {}, ...roiRows];
}
