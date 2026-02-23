export const employer_fast_hiring_manager = (e) => ({
  ...e,
  viewMode: "summary_only",
});

export const employer_risk_averse_hr = (e) => ({
  ...e,
  requiresExplanation: true,
});

export const employer_enterprise_auditor = (e) => ({
  ...e,
  auditMode: true,
});

export const employer_suspicious_employer = (e) => ({
  ...e,
  flags: ["suspicious_behavior"],
});

export const employer_overreaching_data_request = (e) => ({
  ...e,
  flags: ["overreach_attempt"],
});

export const employer_bulk_candidate_review = (e) => ({
  ...e,
  bulkView: true,
});

export const employer_low_signal_candidate = (e) => ({
  ...e,
  candidateSignal: "low",
});

export const employer_conflicting_references = (e) => ({
  ...e,
  flags: ["conflicting_references"],
});

export const employer_reference_heavy_candidate = (e) => ({
  ...e,
  referenceCount: 12,
});

export const employer_fraud_detection_view = (e) => ({
  ...e,
  fraudIndicators: true,
});

export const employer_first_time_user = (e) => ({
  ...e,
  onboardingMode: true,
});

export const employer_power_user = (e) => ({
  ...e,
  advancedFilters: true,
});

export const employer_legal_sensitive = (e) => ({
  ...e,
  legalMode: true,
});

export const employer_international_hire = (e) => ({
  ...e,
  region: "international",
});

export const employer_sales_demo_mode = (e) => ({
  ...e,
  demoClean: true,
});
