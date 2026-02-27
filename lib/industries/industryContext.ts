/**
 * Industry-specific context copy for ROI exports. Conservative, defensible language
 * for CFO, Legal, and Compliance review. No marketing hype.
 */

import type { Industry } from "./index";

/** Industry Context — [Industry]: one short paragraph per industry for ROI export. */
export const INDUSTRY_CONTEXT_EXPORT: Record<Industry, string> = {
  retail:
    "Retail environments experience frequent hiring and high turnover. This simulation estimates the cost of avoidable trust failures that lead to shrink, customer experience degradation, and repeated rehiring cycles.",
  education:
    "Trust failures in education environments carry long-term reputational and community impact. This analysis focuses on preventing decisions that can result in irreversible trust loss and prolonged recovery periods.",
  law_enforcement:
    "Trust failures may result in civil liability, public trust erosion, and federal oversight. This simulation estimates exposure related to negligent hiring, delayed intervention, and supervisory overrides.",
  security:
    "Security roles involve elevated responsibility and contractual risk. This analysis estimates financial exposure related to incident response, insurance impact, and client trust loss.",
  warehouse_logistics:
    "Operational trust failures can cascade into safety incidents, downtime, and missed SLAs. This simulation estimates avoidable loss from delayed detection and workforce instability.",
  healthcare:
    "Trust failures may impact patient safety, licensure, and regulatory compliance. This analysis focuses on reducing exposure to malpractice risk, staffing instability, and supervisory blind spots.",
  hospitality:
    "Guest trust and staff reliability directly affect brand reputation. This simulation estimates losses related to service inconsistency, reviews, and turnover.",
  skilled_trades:
    "Trust failures often surface as safety incidents, rework, and project delays. This analysis estimates financial exposure related to preventable job-site risks.",
  construction:
    "Construction trust failures can result in injuries, stoppages, and litigation. This simulation focuses on avoiding high-severity, low-frequency events with outsized impact.",
};

export function getIndustryContextForExport(industry: Industry): string {
  return INDUSTRY_CONTEXT_EXPORT[industry];
}
