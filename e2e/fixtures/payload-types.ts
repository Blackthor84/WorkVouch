/**
 * Types for E2E payload comparison. Must match getCandidateProfileData / getTrustTrajectory output.
 * No `any`; used to assert structure identity between employee and employer views.
 */

export type EmployerViewProfilePayload = {
  profile: {
    id: string;
    full_name: string;
    email: string;
    [k: string]: unknown;
  } | null;
  jobs: Array<{
    id: string;
    company_name: string;
    job_title: string;
    [k: string]: unknown;
  }>;
  references: Array<{
    id: string;
    from_user?: { full_name?: string; profile_photo_url?: string | null } | null;
    is_direct_manager?: boolean;
    is_repeated_coworker?: boolean;
    is_verified_match?: boolean;
    [k: string]: unknown;
  }>;
  trust_score: number;
  verified_employment_coverage_pct: number;
  verified_employment_count: number;
  total_employment_count: number;
  industry_fields: unknown[];
};

export type TrustTrajectoryPayload = {
  trajectory: "improving" | "stable" | "at_risk";
  label: string;
  tooltipFactors: string[];
};

/** Normalize payload for deterministic comparison: sort arrays by id, strip undefined. */
export function normalizeProfilePayload(p: EmployerViewProfilePayload): EmployerViewProfilePayload {
  const jobs = [...(p.jobs ?? [])].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  const references = [...(p.references ?? [])].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  return {
    profile: p.profile,
    jobs,
    references,
    trust_score: p.trust_score,
    verified_employment_coverage_pct: p.verified_employment_coverage_pct,
    verified_employment_count: p.verified_employment_count,
    total_employment_count: p.total_employment_count,
    industry_fields: p.industry_fields ?? [],
  };
}

export function payloadsIdentical(
  a: EmployerViewProfilePayload,
  b: EmployerViewProfilePayload
): { same: boolean; message?: string } {
  const na = normalizeProfilePayload(a);
  const nb = normalizeProfilePayload(b);
  if (na.profile?.id !== nb.profile?.id) return { same: false, message: "profile.id mismatch" };
  if (na.trust_score !== nb.trust_score) return { same: false, message: `trust_score ${na.trust_score} vs ${nb.trust_score}` };
  if (na.verified_employment_coverage_pct !== nb.verified_employment_coverage_pct)
    return { same: false, message: `verified_employment_coverage_pct mismatch` };
  if (na.verified_employment_count !== nb.verified_employment_count)
    return { same: false, message: "verified_employment_count mismatch" };
  if (na.total_employment_count !== nb.total_employment_count)
    return { same: false, message: "total_employment_count mismatch" };
  if (na.jobs.length !== nb.jobs.length) return { same: false, message: `jobs.length ${na.jobs.length} vs ${nb.jobs.length}` };
  if (na.references.length !== nb.references.length)
    return { same: false, message: `references.length ${na.references.length} vs ${nb.references.length}` };
  for (let i = 0; i < na.jobs.length; i++) {
    if (na.jobs[i].id !== nb.jobs[i].id) return { same: false, message: `jobs[${i}].id mismatch` };
    if (na.jobs[i].company_name !== nb.jobs[i].company_name)
      return { same: false, message: `jobs[${i}].company_name mismatch` };
  }
  for (let i = 0; i < na.references.length; i++) {
    if (na.references[i].id !== nb.references[i].id) return { same: false, message: `references[${i}].id mismatch` };
    if (na.references[i].is_direct_manager !== nb.references[i].is_direct_manager)
      return { same: false, message: `references[${i}].is_direct_manager mismatch` };
    if (na.references[i].is_repeated_coworker !== nb.references[i].is_repeated_coworker)
      return { same: false, message: `references[${i}].is_repeated_coworker mismatch` };
    if (na.references[i].is_verified_match !== nb.references[i].is_verified_match)
      return { same: false, message: `references[${i}].is_verified_match mismatch` };
  }
  return { same: true };
}
