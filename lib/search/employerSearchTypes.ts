/** Canonical employer candidate search filters — single source of truth. */
export type EmployerSearchFilters = {
  query?: string;
  industry?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  minTrustScore?: number;
  maxTrustScore?: number;
};

export type EmployerSearchResult = {
  id: string;
  name: string | null;
  headline: string | null;
  profilePhotoUrl: string | null;
  industry: string | null;
  state: string | null;
  verifiedEmploymentCount: number;
  totalEmploymentCount: number;
  verifiedEmploymentCoveragePct: number;
  trustScore: number | null;
  referenceCount: number;
  aggregateRating: number;
  rehireEligibleCount: number;
  skills: string[];
  auditScore: number | null;
  auditBand: string;
  auditLabel: string;
  auditExplanation: string;
  trustTrajectory: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel: string;
  trustTrajectoryTooltipFactors: string[];
  jobs: Array<{
    company_name: string;
    job_title: string | null;
    start_date: string;
    end_date: string | null;
  }>;
};

export const RECENT_SEARCHES_KEY = "employer_recent_searches";
export const MAX_RECENT_SEARCHES = 8;
