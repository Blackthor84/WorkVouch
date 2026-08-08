"use server";

import { requireAuth } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import {
  searchEmployerCandidates,
  type EmployerSearchFilters,
} from "@/lib/search/employerSearchService";

export type EmployerCandidateRow = {
  id: string;
  full_name: string | null;
  headline: string | null;
  profile_photo_url: string | null;
  trust_score: number;
  reference_count: number;
  verified_coworker_count: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

/**
 * Search candidates for employer workspace widgets. Uses canonical search service.
 */
export async function searchCandidatesForEmployer(params: {
  search?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  minTrust?: number;
  maxTrust?: number;
}): Promise<EmployerCandidateRow[]> {
  const user = await requireAuth();
  const sb = admin as any;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role;
  if (role !== "employer" && role !== "superadmin" && role !== "admin") {
    return [];
  }

  const filters: EmployerSearchFilters = {
    query: params.search,
    company: params.company,
    jobTitle: params.jobTitle,
    location: params.location,
    minTrustScore: params.minTrust,
    maxTrustScore: params.maxTrust,
  };

  if (params.minTrust != null || params.search?.trim()) {
    // active filters
  } else if (
    !params.company?.trim() &&
    !params.jobTitle?.trim() &&
    !params.location?.trim()
  ) {
    filters.minTrustScore = 0;
  }

  const rows = await searchEmployerCandidates(filters, { maxResults: 50 });

  return rows.map((r) => ({
    id: r.id,
    full_name: r.name,
    headline: r.headline,
    profile_photo_url: r.profilePhotoUrl,
    trust_score: r.trustScore ?? 0,
    reference_count: r.referenceCount,
    verified_coworker_count: r.verifiedEmploymentCount,
    jobs: r.jobs,
  }));
}
