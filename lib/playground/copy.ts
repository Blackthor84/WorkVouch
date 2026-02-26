/**
 * Trust Simulation Lab — verbatim UI and compliance copy.
 * Authoritative, enterprise-safe, zero hype.
 */

export const PAGE = {
  title: "Trust Simulation Lab",
  subtitle:
    "Model workforce trust, compliance risk, and culture impact before decisions are made.",
  helperText:
    "All changes in this lab are simulated. Real employee records are never altered.",
} as const;

export const INDUSTRY_SELECTOR = {
  label: "Industry Context",
  helperText:
    "Trust thresholds and risk models adjust automatically based on industry requirements.",
} as const;

export const EMPLOYEE_PROFILE = {
  header: "Employee Trust Profile",
  helperText:
    "This profile reflects all verified trust signals currently available for this individual.",
} as const;

export const CURRENT_TRUST_STATE = {
  title: "Current Trust State",
  subtext:
    "This represents the employee's verified record. This data is immutable.",
  trustScore: "Trust Score",
  confidenceScore: "Confidence Score",
  networkStrength: "Network Strength",
  verificationCount: "Verification Count",
  riskFlags: "Risk Flags",
} as const;

export const SIMULATED_CHANGES = {
  title: "Simulated Changes",
  subtext:
    "Adjust inputs below to model how additional verification or policy changes would affect outcomes.",
  addVerification: "Add Simulated Verification",
  removeSignal: "Remove Simulated Signal",
  adjustThreshold: "Adjust Industry Threshold",
  resetSimulation: "Reset Simulation",
} as const;

export const SIMULATED_OUTCOME = {
  title: "Simulated Outcome",
  subtext:
    "Results reflect projected outcomes if the simulated conditions were applied.",
  projectedTrustScore: "Projected Trust Score",
  projectedConfidenceScore: "Projected Confidence Score",
  eligibilityImpact: "Eligibility Impact",
  riskDelta: "Risk Delta",
} as const;

export const CULTURE_COMPLIANCE = {
  title: "Culture & Compliance Impact",
  subtext:
    "This section shows how the simulated outcome affects team-level trust and compliance posture.",
  teamTrustBeforeAfter: "Team Trust Average (Before / After)",
  complianceThresholdStatus: "Compliance Threshold Status",
  riskConcentrationIndicator: "Risk Concentration Indicator",
} as const;

export const SCENARIO_CONTROLS = {
  title: "Scenario Controls",
  saveScenario: "Save Scenario",
  compareToCurrent: "Compare to Current State",
  exportReport: "Export Scenario Report",
  helperText:
    "Saved scenarios do not modify employee records and can be replayed or audited at any time.",
} as const;

export const WORKFORCE_SIMULATION = {
  title: "Workforce Simulation",
  subtext:
    "Apply simulated changes across departments, roles, or the entire organization.",
  runSimulation: "Run Workforce Simulation",
  applyPolicyAdjustment: "Apply Policy Adjustment",
  exportImpactReport: "Export Workforce Impact Report",
} as const;

export const AUDIT_LOG = {
  title: "Audit Log",
  subtext:
    "Every simulation and export is logged for accountability and compliance review.",
} as const;

/** Flagship demo scenario name (sales, investors, hospitals). */
export const FLAGSHIP_DEMO_SCENARIO_NAME = "Healthcare Hiring Risk Simulation";

/** Flagship demo script (go-to demo for sales, investors, hospitals). */
export const DEMO_SCRIPT = {
  setup:
    "We're going to simulate a healthcare hiring decision without changing any real employee data.",
  step1KeyLine: "This is uncertainty, not risk.",
  step4Closer: "This is what safe hiring looks like.",
  step5Close:
    "This scenario can be saved, audited, and replayed later — nothing here alters history.",
} as const;

/** Compliance messaging — legally safe, auditor-friendly, enterprise-ready. */
export const COMPLIANCE = {
  coreStatement:
    "Trust Simulation Lab separates real employee records from simulated scenarios. All simulations are non-destructive, auditable, and do not modify historical data.",
  dataIntegrity:
    "Verified employment history, peer reviews, and identity data are immutable once recorded. Simulations operate on derived data layers only.",
  auditability:
    "Every simulation, export, and policy adjustment is logged with actor identity, timestamp, and metadata for compliance review.",
  biasFairness:
    "Trust Simulation Lab applies the same rules and thresholds consistently across all candidates. No subjective scoring or manual overrides are permitted.",
  regulatoryPositioning:
    "The system prioritizes uncertainty reduction over optimistic scoring, aligning with high-trust industry compliance standards.",
} as const;

/** Enterprise sales narrative (talk track). */
export const SALES_NARRATIVE = {
  thirtySec:
    "Most hiring tools give you a score and ask you to trust it. WorkVouch's Trust Simulation Lab lets you see every trust signal behind a candidate and model hiring decisions before making them. You can simulate verification, policy changes, and workforce impact — at the individual or organizational level — without altering real records. It's a decision system for people risk.",
  sixtySec:
    "Trust Simulation Lab is a workforce decision engine. Instead of guessing whether a candidate is safe to hire, employers can simulate verification, policy adjustments, and hiring outcomes before acting. The system shows how trust, compliance, and culture shift — not just for one person, but across teams or the entire organization. Every action is explainable, auditable, and reversible.",
  differentiator: "We don't tell you who to hire. We show you what happens if you do.",
  objectionKiller:
    "Background checks tell you about the past. Trust Simulation Lab helps you make safer decisions about the future.",
} as const;
