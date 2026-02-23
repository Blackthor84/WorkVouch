export const employer_fast_hiring_manager = (e: Record<string, unknown>) => ({
  ...e,
  viewMode: "summary_only",
});

export const employer_risk_averse_hr = (e: Record<string, unknown>) => ({
  ...e,
  requiresExplanation: true,
});

export const employer_enterprise_auditor = (e: Record<string, unknown>) => ({
  ...e,
  auditMode: true,
});

export const employer_suspicious_employer = (e: Record<string, unknown>) => ({
  ...e,
  flags: ["suspicious_behavior"],
});

export const employer_overreaching_data_request = (e: Record<string, unknown>) => ({
  ...e,
  flags: ["overreach_attempt"],
});

export const employer_bulk_candidate_review = (e: Record<string, unknown>) => ({
  ...e,
  bulkView: true,
});

export const employer_low_signal_candidate = (e: Record<string, unknown>) => ({
  ...e,
  candidateSignal: "low",
});

export const employer_conflicting_references = (e: Record<string, unknown>) => ({
  ...e,
  flags: ["conflicting_references"],
});

export const employer_reference_heavy_candidate = (e: Record<string, unknown>) => ({
  ...e,
  referenceCount: 12,
});

export const employer_fraud_detection_view = (e: Record<string, unknown>) => ({
  ...e,
  fraudIndicators: true,
});

export const employer_first_time_user = (e: Record<string, unknown>) => ({
  ...e,
  onboardingMode: true,
});

export const employer_power_user = (e: Record<string, unknown>) => ({
  ...e,
  advancedFilters: true,
});

export const employer_legal_sensitive = (e: Record<string, unknown>) => ({
  ...e,
  legalMode: true,
});

export const employer_international_hire = (e: Record<string, unknown>) => ({
  ...e,
  region: "international",
});

export const employer_sales_demo_mode = (e: Record<string, unknown>) => ({
  ...e,
  demoClean: true,
});
