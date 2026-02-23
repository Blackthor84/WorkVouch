export type DemoStep = {
  title: string;
  description: string;
  actorType: "employee" | "employer";
  scenario: string;
  durationMs?: number;
};

export const demoFlows = {
  employer_buyer: [
    {
      title: "Candidate Overview",
      description: "High-level trust score and work history",
      actorType: "employer",
      scenario: "employer_fast_hiring_manager",
      durationMs: 8000,
    },
    {
      title: "Conflicting References",
      description: "See how WorkVouch flags risk clearly",
      actorType: "employer",
      scenario: "employer_conflicting_references",
      durationMs: 8000,
    },
    {
      title: "Fraud Signals",
      description: "Abuse detection without accusations",
      actorType: "employer",
      scenario: "employer_fraud_detection_view",
      durationMs: 8000,
    },
    {
      title: "Final Decision View",
      description: "One-screen hiring confidence",
      actorType: "employer",
      scenario: "employer_sales_demo_mode",
    },
  ],

  employee_trust: [
    {
      title: "Verified Work History",
      description: "Peers confirm real employment",
      actorType: "employee",
      scenario: "employee_high_trust_long_tenure",
    },
    {
      title: "Dispute Resolution",
      description: "How workers protect themselves",
      actorType: "employee",
      scenario: "employee_reference_dispute",
    },
  ],

  enterprise_compliance: [
    {
      title: "Audit Timeline",
      description: "Enterprise-grade traceability",
      actorType: "employer",
      scenario: "employer_enterprise_auditor",
    },
    {
      title: "Legal Safeguards",
      description: "Defamation and consent protection",
      actorType: "employer",
      scenario: "employer_legal_sensitive",
    },
  ],
} as const;

export type DemoFlowKey = keyof typeof demoFlows;
