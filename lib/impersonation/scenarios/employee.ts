export const employee_perfect_candidate = (u: Record<string, unknown>) => ({
  ...u,
  trustScore: 95,
  flags: [],
});

export const employee_conflicting_dates = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["date_conflict"],
});

export const employee_fake_coworker_attempt = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["suspicious_reference"],
});

export const employee_weak_references = (u: Record<string, unknown>) => ({
  ...u,
  referenceQuality: "weak",
});

export const employee_mixed_manager_peer = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["manager_peer_disagreement"],
});

export const employee_recent_termination = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["recent_termination"],
});

export const employee_role_inflation = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["role_mismatch"],
});

export const employee_reference_dispute = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["reference_disputed"],
});

export const employee_single_reference = (u: Record<string, unknown>) => ({
  ...u,
  referenceCount: 1,
});

export const employee_high_trust_long_tenure = (u: Record<string, unknown>) => ({
  ...u,
  trustScore: 98,
  tenureYears: 6,
});

export const employee_job_hopper = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["job_hopper"],
});

export const employee_copy_paste_reviews = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["duplicate_reviews"],
});

export const employee_probationary_employee = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["probation"],
});

export const employee_abuse_flagged = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["abuse_pattern"],
});

export const employee_underqualified_but_vouched = (u: Record<string, unknown>) => ({
  ...u,
  flags: ["underqualified"],
  trustScore: 72,
});
