import { admin } from "@/lib/supabase-admin";
import {
  getEmployeeAuditScoresBatch,
  getAuditLabel,
  getAuditExplanation,
  compareAuditForRank,
  type AuditBand,
} from "@/lib/scoring/employeeAuditScore";
import { getTrustTrajectoryBatch } from "@/lib/trust/trustTrajectory";
import type { EmployerSearchFilters, EmployerSearchResult } from "@/lib/search/employerSearchTypes";

const MAX_RESULTS = 50;

export function parseEmployerSearchFilters(searchParams: URLSearchParams): EmployerSearchFilters {
  const min = searchParams.get("minTrustScore");
  const max = searchParams.get("maxTrustScore");
  return {
    query: searchParams.get("query")?.trim() || undefined,
    industry: searchParams.get("industry")?.trim() || undefined,
    jobTitle: searchParams.get("jobTitle")?.trim() || undefined,
    company: searchParams.get("company")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    minTrustScore: min ? Number(min) : undefined,
    maxTrustScore: max ? Number(max) : undefined,
  };
}

export function hasActiveEmployerSearchFilters(filters: EmployerSearchFilters): boolean {
  return Boolean(
    filters.query?.trim() ||
      filters.industry ||
      filters.jobTitle ||
      filters.company ||
      filters.location ||
      filters.minTrustScore != null ||
      filters.maxTrustScore != null,
  );
}

type ViewRow = {
  user_id: string;
  full_name: string | null;
  industry: string | null;
  state: string | null;
  verified_employment_count: number;
  total_employment_count: number;
  verified_employment_coverage_pct: number;
  trust_score: number;
  reference_count: number;
  aggregate_rating: number;
  rehire_eligible_count: number;
};

/**
 * Canonical employer candidate search + ranking.
 * Uses employer_candidate_view, then applies unified filters and audit-based ranking.
 */
export async function searchEmployerCandidates(
  filters: EmployerSearchFilters,
  options: { limitedPreview?: boolean; maxResults?: number } = {},
): Promise<EmployerSearchResult[]> {
  const limitedPreview = options.limitedPreview ?? false;
  const limit = options.maxResults ?? MAX_RESULTS;

  if (!hasActiveEmployerSearchFilters(filters)) {
    return [];
  }

  let query = admin
    .from("employer_candidate_view")
    .select(
      "user_id, full_name, industry, state, verified_employment_count, total_employment_count, verified_employment_coverage_pct, trust_score, reference_count, aggregate_rating, rehire_eligible_count",
    )
    .eq("restricted_from_employer_search", false);

  if (filters.query) {
    const sanitized = filters.query.replace(/[%_]/g, "");
    if (sanitized.length < 2) return [];
    query = query.ilike("full_name", `%${sanitized}%`);
  }

  if (filters.industry) {
    query = query.eq("industry", filters.industry);
  }

  if (filters.location) {
    const loc = filters.location.replace(/[%_]/g, "").trim();
    if (loc) {
      query = query.ilike("state", `%${loc}%`);
    }
  }

  if (filters.minTrustScore != null) {
    query = query.gte("trust_score", filters.minTrustScore);
  }

  if (filters.maxTrustScore != null) {
    query = query.lte("trust_score", filters.maxTrustScore);
  }

  const { data: candidates, error } = await query
    .order("trust_score", { ascending: false })
    .limit(limit * 2);

  if (error || !candidates?.length) {
    return [];
  }

  let candidateList = candidates as ViewRow[];
  const userIds = candidateList.map((c) => c.user_id);

  type JobRow = {
    user_id: string;
    company_name: string;
    job_title?: string | null;
    title?: string | null;
    start_date: string;
    end_date: string | null;
  };

  const [auditScoresMap, skillsResult, trajectoryMap, jobsResult, profilesResult] =
    await Promise.all([
      getEmployeeAuditScoresBatch(userIds),
      admin.from("skills").select("user_id, skill_name").in("user_id", userIds),
      getTrustTrajectoryBatch(userIds),
      admin
        .from("jobs")
        .select("user_id, company_name, job_title, title, start_date, end_date")
        .in("user_id", userIds)
        .or("is_visible_to_employer.eq.true,is_visible_to_employer.is.null")
        .order("start_date", { ascending: false }),
      admin.from("profiles").select("id, headline, profile_photo_url").in("id", userIds),
    ]);

  const skillsByUser = new Map<string, string[]>();
  for (const s of (skillsResult.data ?? []) as { user_id: string; skill_name: string }[]) {
    if (!skillsByUser.has(s.user_id)) skillsByUser.set(s.user_id, []);
    skillsByUser.get(s.user_id)!.push(s.skill_name);
  }

  const jobsByUser = new Map<string, JobRow[]>();
  for (const row of (jobsResult.data ?? []) as JobRow[]) {
    if (!jobsByUser.has(row.user_id)) jobsByUser.set(row.user_id, []);
    jobsByUser.get(row.user_id)!.push(row);
  }

  const profileMeta = new Map<
    string,
    { headline: string | null; profile_photo_url: string | null }
  >();
  for (const p of (profilesResult.data ?? []) as {
    id: string;
    headline?: string | null;
    profile_photo_url?: string | null;
  }[]) {
    profileMeta.set(p.id, {
      headline: p.headline ?? null,
      profile_photo_url: p.profile_photo_url ?? null,
    });
  }

  if (filters.company?.trim()) {
    const companyLower = filters.company.trim().toLowerCase();
    candidateList = candidateList.filter((c) => {
      const jobs = jobsByUser.get(c.user_id) ?? [];
      return jobs.some((j) => j.company_name?.toLowerCase().includes(companyLower));
    });
  }

  if (filters.jobTitle?.trim()) {
    const titleLower = filters.jobTitle.trim().toLowerCase();
    candidateList = candidateList.filter((c) => {
      const jobs = jobsByUser.get(c.user_id) ?? [];
      return jobs.some((j) =>
        (j.job_title ?? j.title ?? "").toLowerCase().includes(titleLower),
      );
    });
  }

  candidateList.sort((a, b) =>
    compareAuditForRank(auditScoresMap.get(a.user_id) ?? null, auditScoresMap.get(b.user_id) ?? null),
  );

  const results: EmployerSearchResult[] = candidateList.slice(0, limit).map((c) => {
    const audit = auditScoresMap.get(c.user_id);
    const band: AuditBand = audit?.band ?? "unverified";
    const trajectory = trajectoryMap.get(c.user_id);
    const meta = profileMeta.get(c.user_id);
    const userJobs = (jobsByUser.get(c.user_id) ?? []).map((j) => ({
      company_name: j.company_name ?? "",
      job_title: j.job_title ?? j.title ?? null,
      start_date: j.start_date,
      end_date: j.end_date,
    }));

    if (limitedPreview) {
      return {
        id: c.user_id,
        name: c.full_name,
        headline: meta?.headline ?? null,
        profilePhotoUrl: meta?.profile_photo_url ?? null,
        industry: null,
        state: c.state ?? null,
        verifiedEmploymentCount: 0,
        totalEmploymentCount: 0,
        verifiedEmploymentCoveragePct: 0,
        trustScore: null,
        referenceCount: 0,
        aggregateRating: 0,
        rehireEligibleCount: 0,
        skills: [],
        auditScore: null,
        auditBand: "unverified",
        auditLabel: "Preview",
        auditExplanation: "See full candidate insights with a paid plan.",
        trustTrajectory: "stable",
        trustTrajectoryLabel: "—",
        trustTrajectoryTooltipFactors: [],
        jobs: userJobs.slice(0, 1),
      };
    }

    return {
      id: c.user_id,
      name: c.full_name,
      headline: meta?.headline ?? null,
      profilePhotoUrl: meta?.profile_photo_url ?? null,
      industry: c.industry ?? null,
      state: c.state ?? null,
      verifiedEmploymentCount: c.verified_employment_count ?? 0,
      totalEmploymentCount: c.total_employment_count ?? 0,
      verifiedEmploymentCoveragePct: c.verified_employment_coverage_pct ?? 0,
      trustScore: c.trust_score ?? 0,
      referenceCount: c.reference_count ?? 0,
      aggregateRating: c.aggregate_rating ?? 0,
      rehireEligibleCount: c.rehire_eligible_count ?? 0,
      skills: (skillsByUser.get(c.user_id) ?? []).slice(0, 10),
      auditScore: audit?.score ?? null,
      auditBand: band,
      auditLabel: getAuditLabel(band),
      auditExplanation: audit
        ? getAuditExplanation(band, audit.breakdown)
        : "Verification data not yet calculated.",
      trustTrajectory: trajectory?.trajectory ?? "stable",
      trustTrajectoryLabel: trajectory?.label ?? "Stable",
      trustTrajectoryTooltipFactors: trajectory?.tooltipFactors ?? [],
      jobs: userJobs,
    };
  });

  return results;
}

/** Map canonical search result to CandidateCard props. */
export function toCandidateCardData(result: EmployerSearchResult) {
  return {
    id: result.id,
    full_name: result.name,
    headline: result.headline ?? result.industry,
    profile_photo_url: result.profilePhotoUrl,
    trust_score: result.trustScore ?? 0,
    reference_count: result.referenceCount,
    verified_coworker_count: result.verifiedEmploymentCount,
    jobs:
      result.jobs.length > 0
        ? result.jobs
        : [
            {
              company_name: result.industry ?? "—",
              job_title: null,
              start_date: "",
              end_date: null,
            },
          ],
  };
}
