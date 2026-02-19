"use server";

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";

export type PassportViewLevel = "public" | "limited_employer" | "limited_shared" | "private";

export type PassportSearchResultItem =
  | {
      view: "public" | "limited_employer" | "limited_shared";
      profileId: string;
      slug: string;
      fullName: string;
      industry: string | null;
      profileStrength?: number;
      employmentPreview?: { company_name: string; job_title: string }[];
      credentialCount?: number;
      coworkerVerificationCount?: number;
    }
  | {
      view: "private";
      profileId: string;
      slug: string;
      status: "private";
      message: string;
      inviteOption: true;
    };

export type PassportSearchResponse = {
  results: PassportSearchResultItem[];
  error?: string;
};

export type SinglePassportResponse =
  | { view: "public" | "limited_employer" | "limited_shared"; data: unknown }
  | {
      status: "private";
      message: string;
      inviteOption: true;
    }
  | { error: string };

/**
 * Check if requester (employer) has "shared employment overlap" with profile:
 * employer's company_name matches one of the profile's job company_name (case-insensitive).
 */
async function hasSharedEmploymentOverlap(
  sb: any,
  employerCompanyName: string,
  profileId: string
): Promise<boolean> {
  const normalized = employerCompanyName.trim().toLowerCase();
  if (!normalized) return false;
  const { data: jobs } = await sb
    .from("jobs")
    .select("company_name")
    .eq("user_id", profileId);
  const list = (jobs ?? []) as { company_name: string }[];
  return list.some((j) => (j.company_name ?? "").toLowerCase() === normalized);
}

/**
 * Build limited view payload (no dispute details, internal flags, private notes).
 */
async function buildLimitedView(sb: any, profileId: string): Promise<Record<string, unknown>> {
  const { data: profile } = await sb
    .from("profiles")
    .select("id, full_name, industry, city, state, profile_photo_url, passport_username")
    .eq("id", profileId)
    .single();
  if (!profile) return {};
  const { data: jobs } = await sb
    .from("jobs")
    .select("id, company_name, job_title, start_date, end_date, verification_status")
    .eq("user_id", profileId)
    .eq("is_private", false)
    .order("start_date", { ascending: false });
  const { data: trustRow } = await sb
    .from("trust_scores")
    .select("score")
    .eq("user_id", profileId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const score = (trustRow as { score?: number } | null)?.score ?? 0;
  const { count: refCount } = await sb
    .from("user_references")
    .select("id", { count: "exact", head: true })
    .eq("to_user_id", profileId);
  let credentialCount = 0;
  try {
    const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", profileId);
    credentialCount = Array.isArray(cred) ? cred.length : 0;
  } catch {
    // ignore
  }
  return {
    profile: { ...profile, passport_username: (profile as any).passport_username ?? null },
    jobs: jobs ?? [],
    profileStrength: Math.min(100, Math.max(0, Number(score))),
    referenceCount: refCount ?? 0,
    credentialCount,
    industryBadge: (profile as any).industry ?? null,
  };
}

/**
 * Search passports. Requires authenticated user (employer or employee).
 * Inputs: name, employer, industry. No direct client Supabase.
 * Access: is_public_passport → full public; else verified employer + searchable_by_verified_employers → limited employer;
 * else shared overlap + searchable_by_shared_employers → limited shared; else private with inviteOption.
 */
export async function searchPassport(params: {
  name?: string;
  employer?: string;
  industry?: string;
}): Promise<PassportSearchResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { results: [], error: "Unauthorized" };
  }

  const sb = getSupabaseServer() as any;
  const isEmployer = await hasRole("employer");
  let employerId: string | null = null;
  let employerCompanyName: string | null = null;
  if (isEmployer) {
    const { data: ea } = await sb
      .from("employer_accounts")
      .select("id, company_name")
      .eq("user_id", user.id)
      .maybeSingle();
    employerId = (ea as { id?: string } | null)?.id ?? null;
    employerCompanyName = (ea as { company_name?: string } | null)?.company_name ?? null;
  }

  const name = (params.name ?? "").trim();
  const employer = (params.employer ?? "").trim();
  const industry = (params.industry ?? "").trim();

  let chain = sb
    .from("profiles")
    .select("id, full_name, industry, is_public_passport, searchable_by_verified_employers, searchable_by_shared_employers, passport_username")
    .order("full_name", { ascending: true })
    .limit(100);

  if (name) chain = chain.ilike("full_name", `%${name}%`);
  if (industry) chain = chain.eq("industry", industry);

  const { data: profiles, error } = await chain;
  if (error) return { results: [], error: "Search failed" };

  const list = (profiles ?? []) as {
    id: string;
    full_name: string;
    industry: string | null;
    is_public_passport: boolean;
    searchable_by_verified_employers: boolean;
    searchable_by_shared_employers: boolean;
    passport_username: string | null;
  }[];

  if (employer) {
    const { data: jobUsers } = await sb
      .from("jobs")
      .select("user_id")
      .ilike("company_name", `%${employer}%`);
    const userIds = new Set((jobUsers ?? []).map((r: { user_id: string }) => r.user_id));
    if (userIds.size > 0) {
      const filtered = list.filter((p) => userIds.has(p.id));
      if (filtered.length === 0) return { results: [] };
      // Continue with filtered list
      list.length = 0;
      list.push(...filtered);
    }
  }

  const results: PassportSearchResultItem[] = [];
  for (const p of list) {
    const slug = (p.passport_username ?? p.id) as string;
    const isPublic = p.is_public_passport === true;
    const searchableVerified = p.searchable_by_verified_employers !== false;
    const searchableShared = p.searchable_by_shared_employers !== false;

    if (isPublic) {
      const { data: trustRow } = await sb
        .from("trust_scores")
        .select("score")
        .eq("user_id", p.id)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const score = (trustRow as { score?: number } | null)?.score ?? 0;
      const { data: jobPreview } = await sb
        .from("jobs")
        .select("company_name, job_title")
        .eq("user_id", p.id)
        .order("start_date", { ascending: false })
        .limit(3);
      const { count: refCount } = await sb
        .from("user_references")
        .select("id", { count: "exact", head: true })
        .eq("to_user_id", p.id);
      let credCount = 0;
      try {
        const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", p.id);
        credCount = Array.isArray(cred) ? cred.length : 0;
      } catch {
        // ignore
      }
      results.push({
        view: "public",
        profileId: p.id,
        slug,
        fullName: p.full_name ?? "",
        industry: p.industry,
        profileStrength: Math.min(100, Math.max(0, Number(score))),
        employmentPreview: (jobPreview ?? []).map((j: { company_name: string; job_title: string }) => ({ company_name: j.company_name, job_title: j.job_title })),
        credentialCount: credCount,
        coworkerVerificationCount: refCount ?? 0,
      });
      continue;
    }

    if (isEmployer && employerId && searchableVerified) {
      const { data: trustRow } = await sb
        .from("trust_scores")
        .select("score")
        .eq("user_id", p.id)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const score = (trustRow as { score?: number } | null)?.score ?? 0;
      const { data: jobPreview } = await sb
        .from("jobs")
        .select("company_name, job_title")
        .eq("user_id", p.id)
        .order("start_date", { ascending: false })
        .limit(3);
      const { count: refCount } = await sb
        .from("user_references")
        .select("id", { count: "exact", head: true })
        .eq("to_user_id", p.id);
      let credCount = 0;
      try {
        const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", p.id);
        credCount = Array.isArray(cred) ? cred.length : 0;
      } catch {
        // ignore
      }
      results.push({
        view: "limited_employer",
        profileId: p.id,
        slug,
        fullName: p.full_name ?? "",
        industry: p.industry,
        profileStrength: Math.min(100, Math.max(0, Number(score))),
        employmentPreview: (jobPreview ?? []).map((j: { company_name: string; job_title: string }) => ({ company_name: j.company_name, job_title: j.job_title })),
        credentialCount: credCount,
        coworkerVerificationCount: refCount ?? 0,
      });
      continue;
    }

    if (isEmployer && employerCompanyName && searchableShared) {
      const overlap = await hasSharedEmploymentOverlap(sb, employerCompanyName, p.id);
      if (overlap) {
        const { data: trustRow } = await sb
          .from("trust_scores")
          .select("score")
          .eq("user_id", p.id)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const score = (trustRow as { score?: number } | null)?.score ?? 0;
        const { data: jobPreview } = await sb
          .from("jobs")
          .select("company_name, job_title")
          .eq("user_id", p.id)
          .order("start_date", { ascending: false })
          .limit(3);
        const { count: refCount } = await sb
          .from("user_references")
          .select("id", { count: "exact", head: true })
          .eq("to_user_id", p.id);
        let credCount = 0;
        try {
          const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", p.id);
          credCount = Array.isArray(cred) ? cred.length : 0;
        } catch {
          // ignore
        }
        results.push({
          view: "limited_shared",
          profileId: p.id,
          slug,
          fullName: p.full_name ?? "",
          industry: p.industry,
          profileStrength: Math.min(100, Math.max(0, Number(score))),
          employmentPreview: (jobPreview ?? []).map((j: { company_name: string; job_title: string }) => ({ company_name: j.company_name, job_title: j.job_title })),
          credentialCount: credCount,
          coworkerVerificationCount: refCount ?? 0,
        });
        continue;
      }
    }

    results.push({
      view: "private",
      profileId: p.id,
      slug,
      status: "private",
      message: "This professional has not made their Verified Work Profile publicly searchable.",
      inviteOption: true,
    });
  }

  return { results };
}

/**
 * Get single passport view by slug. If requester is employer, log to search_logs.
 * Returns public / limited_employer / limited_shared view or private with inviteOption.
 */
export async function getPassportViewBySlug(slug: string): Promise<SinglePassportResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const sb = getSupabaseServer() as any;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  let profile: {
    id: string;
    full_name: string;
    industry: string | null;
    is_public_passport: boolean;
    searchable_by_verified_employers: boolean;
    searchable_by_shared_employers: boolean;
    passport_username: string | null;
  } | null = null;

  if (isUuid) {
    const { data } = await sb
      .from("profiles")
      .select("id, full_name, industry, is_public_passport, searchable_by_verified_employers, searchable_by_shared_employers, passport_username")
      .eq("id", slug)
      .maybeSingle();
    profile = data;
  } else {
    const { data } = await sb
      .from("profiles")
      .select("id, full_name, industry, is_public_passport, searchable_by_verified_employers, searchable_by_shared_employers, passport_username")
      .eq("passport_username", slug)
      .maybeSingle();
    profile = data;
  }

  if (!profile) return { error: "Profile not found" };

  let employerId: string | null = null;
  let employerCompanyName: string | null = null;
  const isEmployer = await hasRole("employer");
  if (isEmployer) {
    const { data: ea } = await sb
      .from("employer_accounts")
      .select("id, company_name")
      .eq("user_id", user.id)
      .maybeSingle();
    employerId = (ea as { id?: string } | null)?.id ?? null;
    employerCompanyName = (ea as { company_name?: string } | null)?.company_name ?? null;
  }

  const isPublic = profile.is_public_passport === true;
  const searchableVerified = profile.searchable_by_verified_employers !== false;
  const searchableShared = profile.searchable_by_shared_employers !== false;

  if (isEmployer && employerId) {
    try {
      await sb.from("search_logs").insert({
        employer_id: employerId,
        searched_profile_id: profile.id,
      });
    } catch {
      // non-fatal audit log
    }
  }

  if (isPublic) {
    const data = await buildLimitedView(sb, profile.id);
    return { view: "public", data };
  }
  if (isEmployer && employerId && searchableVerified) {
    const data = await buildLimitedView(sb, profile.id);
    return { view: "limited_employer", data };
  }
  if (isEmployer && employerCompanyName && searchableShared) {
    const overlap = await hasSharedEmploymentOverlap(sb, employerCompanyName, profile.id);
    if (overlap) {
      const data = await buildLimitedView(sb, profile.id);
      return { view: "limited_shared", data };
    }
  }

  return {
    status: "private",
    message: "This professional has not made their Verified Work Profile publicly searchable.",
    inviteOption: true,
  };
}
