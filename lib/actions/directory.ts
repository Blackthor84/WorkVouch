"use server";

import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { checkPublicDirectoryRateLimit, consumePublicDirectoryRateLimit } from "@/lib/directory/rate-limit";
import { getProductionSimulationFilter } from "@/lib/simulation-lab";

const PUBLIC_PAGE_SIZE = 20;
const EMPLOYER_LITE_MAX = 25;
const EMPLOYER_PRO_MAX = 100;

function profileStrengthRange(score: number): "High" | "Medium" | "Developing" {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Developing";
}

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const real = h.get("x-real-ip");
    if (forwarded) return forwarded.split(",")[0].trim();
    if (real) return real;
  } catch {
    // ignore
  }
  return "unknown";
}

export type PublicDirectoryItem = {
  id: string;
  full_name: string;
  industry: string | null;
  profile_photo_url: string | null;
  profileStrengthRange: "High" | "Medium" | "Developing";
  verified: boolean;
  url: string;
};

export type PublicDirectoryResult = {
  items: PublicDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rateLimitRemaining?: number;
  error?: string;
};

export type EmployerDirectoryFilters = {
  name?: string;
  currentEmployer?: string;
  pastEmployer?: string;
  industry?: string;
  location?: string;
  verifiedOnly?: boolean;
  minProfileStrength?: number;
  credentialCompliance?: boolean;
};

export type EmployerDirectoryItem = {
  id: string;
  full_name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  profileStrength: number;
  credentialSummary: string;
  referenceResponseRate: number | null;
  integrityStatus: string;
  employmentTimelinePreview: { company_name: string; job_title: string }[];
  url: string;
};

export type EmployerDirectoryResult = {
  items: EmployerDirectoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
};

/**
 * Public directory search: name only, max 20 per page, rate limited (10/hour), range masking.
 */
export async function searchDirectoryPublic(params: {
  name: string;
  page?: number;
}): Promise<PublicDirectoryResult> {
  const ip = await getClientIp();
  const { allowed, remaining } = checkPublicDirectoryRateLimit(ip);
  if (!allowed) {
    return {
      items: [],
      total: 0,
      page: 1,
      limit: PUBLIC_PAGE_SIZE,
      totalPages: 0,
      rateLimitRemaining: 0,
      error: "Rate limit exceeded. Try again later.",
    };
  }

  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PUBLIC_PAGE_SIZE;
  const name = (params.name ?? "").trim();

  const supabase = await createServerSupabase();
  const sb = supabase as any;

  let chain = sb
    .from("profiles")
    .select("id, full_name, industry, profile_photo_url", { count: "exact" })
    .eq("visibility", "public")
    .order("full_name", { ascending: true })
    .range(offset, offset + PUBLIC_PAGE_SIZE - 1);

  const simFilter = await getProductionSimulationFilter();
  if (simFilter.is_simulation === false) chain = chain.eq("is_simulation", false);

  if (name) {
    chain = chain.ilike("full_name", `%${name}%`);
  }

  const { data: profiles, error, count } = await chain;

  if (error) {
    return {
      items: [],
      total: 0,
      page,
      limit: PUBLIC_PAGE_SIZE,
      totalPages: 0,
      error: "Search failed.",
    };
  }

  consumePublicDirectoryRateLimit(ip);

  const list = (profiles ?? []) as { id: string; full_name: string; industry: string | null; profile_photo_url: string | null }[];
  const ids = list.map((p) => p.id);

  const { data: trustRows } = await sb.from("trust_scores").select("user_id, score, calculated_at").in("user_id", ids).order("calculated_at", { ascending: false });
  const trustByUser = new Map<string, number>();
  for (const r of (trustRows ?? []) as { user_id: string; score: number }[]) {
    if (!trustByUser.has(r.user_id)) trustByUser.set(r.user_id, r.score);
  }

  let verifiedIds = new Set<string>();
  if (ids.length > 0) {
    const { data: jobs } = await sb.from("jobs").select("user_id, verification_status").in("user_id", ids);
    verifiedIds = new Set(
      (jobs ?? []).filter((j: { verification_status: string }) => j.verification_status === "verified").map((j: { user_id: string }) => j.user_id)
    );
  }

  const items: PublicDirectoryItem[] = list.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    industry: p.industry,
    profile_photo_url: p.profile_photo_url,
    profileStrengthRange: profileStrengthRange(Math.min(100, Math.max(0, trustByUser.get(p.id) ?? 0))),
    verified: verifiedIds.has(p.id),
    url: `/u/${p.id}`,
  }));

  const total = typeof count === "number" ? count : list.length;

  return {
    items,
    total,
    page,
    limit: PUBLIC_PAGE_SIZE,
    totalPages: Math.ceil(total / PUBLIC_PAGE_SIZE),
    rateLimitRemaining: remaining - 1,
  };
}

/**
 * Employer directory search: full filters, plan-based limits, logging, exact scores.
 */
export async function searchDirectoryEmployer(params: {
  filters: EmployerDirectoryFilters;
  page?: number;
  limit?: number;
}): Promise<EmployerDirectoryResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { items: [], total: 0, page: 1, limit: 20, totalPages: 0, error: "Unauthorized" };
  }
  const isEmployer = await hasRole("employer");
  if (!isEmployer) {
    return { items: [], total: 0, page: 1, limit: 20, totalPages: 0, error: "Employer account required" };
  }

  const supabaseAdmin = getSupabaseServer() as any;
  const { data: ea } = await supabaseAdmin.from("employer_accounts").select("id, plan_tier").eq("user_id", user.id).maybeSingle();
  const employerId = (ea as { id?: string } | null)?.id;
  const planTier = ((ea as { plan_tier?: string } | null)?.plan_tier ?? "free").toLowerCase();

  if (!employerId) {
    return { items: [], total: 0, page: 1, limit: 20, totalPages: 0, error: "Employer account not found" };
  }

  const limit = Math.min(
    planTier === "custom" ? 500 : planTier === "pro" ? EMPLOYER_PRO_MAX : EMPLOYER_LITE_MAX,
    Math.max(1, params.limit ?? 20)
  );
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;
  const f = params.filters ?? {};

  if (planTier === "lite" || planTier === "free" || planTier === "basic") {
    if (f.currentEmployer || f.pastEmployer || f.location || f.minProfileStrength != null || f.credentialCompliance) {
      return { items: [], total: 0, page, limit, totalPages: 0, error: "Advanced filters require Pro or Enterprise." };
    }
  }

  const sb = supabaseAdmin;
  const simFilter = await getProductionSimulationFilter();
  let chain = sb
    .from("profiles")
    .select("id, full_name, industry, city, state, profile_photo_url", { count: "exact" })
    .eq("visibility", "public")
    .order("full_name", { ascending: true })
    .range(offset, offset + limit - 1);
  if (simFilter.is_simulation === false) chain = chain.eq("is_simulation", false);

  if (f.name?.trim()) chain = chain.ilike("full_name", `%${f.name.trim()}%`);
  if (f.industry?.trim()) chain = chain.eq("industry", f.industry.trim());
  if (f.location?.trim()) chain = chain.or(`city.ilike.%${f.location}%,state.ilike.%${f.location}%`);

  const { data: profiles, error, count } = await chain;

  if (error) {
    return { items: [], total: 0, page, limit, totalPages: 0, error: "Search failed." };
  }

  let list = (profiles ?? []) as { id: string; full_name: string; industry: string | null; city: string | null; state: string | null; profile_photo_url: string | null }[];
  let ids = list.map((p) => p.id);

  if (f.currentEmployer?.trim() || f.pastEmployer?.trim()) {
    const { data: jobs } = await sb.from("jobs").select("user_id, company_name").in("user_id", ids);
    const jobList = (jobs ?? []) as { user_id: string; company_name: string }[];
    const byUser = new Map<string, string[]>();
    for (const j of jobList) {
      if (!byUser.has(j.user_id)) byUser.set(j.user_id, []);
      byUser.get(j.user_id)!.push(j.company_name.toLowerCase());
    }
    const current = (f.currentEmployer ?? "").toLowerCase();
    const past = (f.pastEmployer ?? "").toLowerCase();
    const idSet = new Set(ids.filter((id) => {
      const companies = byUser.get(id) ?? [];
      if (current && !companies.includes(current)) return false;
      if (past && !companies.includes(past)) return false;
      return true;
    }));
    list = list.filter((p) => idSet.has(p.id));
    ids = list.map((p) => p.id);
  }

  const { data: trustRows } = await sb.from("trust_scores").select("user_id, score, calculated_at").in("user_id", ids).order("calculated_at", { ascending: false });
  const trustByUser = new Map<string, number>();
  for (const r of (trustRows ?? []) as { user_id: string; score: number }[]) {
    if (!trustByUser.has(r.user_id)) trustByUser.set(r.user_id, r.score);
  }

  if (f.minProfileStrength != null && f.minProfileStrength > 0) {
    const min = f.minProfileStrength;
    list = list.filter((p) => (trustByUser.get(p.id) ?? 0) >= min);
  }

  if (f.verifiedOnly && list.length > 0) {
    const { data: jobs } = await sb.from("jobs").select("user_id, verification_status").in("user_id", list.map((p) => p.id));
    const verifiedIds = new Set((jobs ?? []).filter((j: { verification_status: string }) => j.verification_status === "verified").map((j: { user_id: string }) => j.user_id));
    list = list.filter((p) => verifiedIds.has(p.id));
  }

  const resultIds = list.map((p) => p.id);
  const items: EmployerDirectoryItem[] = [];

  for (const p of list) {
    const score = Math.min(100, Math.max(0, trustByUser.get(p.id) ?? 0));
    const { data: jobs } = await sb.from("jobs").select("company_name, job_title").eq("user_id", p.id).order("start_date", { ascending: false }).limit(5);
    const { count: refCount } = await sb.from("user_references").select("id", { count: "exact", head: true }).eq("to_user_id", p.id);
    const { data: jobList } = await sb.from("jobs").select("id").eq("user_id", p.id);
    const jobIds = (jobList ?? []).map((j: { id: string }) => j.id);
    let refRate: number | null = null;
    if (jobIds.length > 0) {
      const totalRefs = jobIds.length;
      refRate = Math.round(((refCount ?? 0) / totalRefs) * 100);
    }
    const { data: creds } = await sb.from("guard_licenses").select("id").eq("user_id", p.id);
    const credCount = Array.isArray(creds) ? creds.length : 0;

    items.push({
      id: p.id,
      full_name: p.full_name,
      industry: p.industry,
      city: p.city,
      state: p.state,
      profile_photo_url: p.profile_photo_url,
      profileStrength: Math.round(score),
      credentialSummary: credCount > 0 ? `${credCount} credential(s) on file` : "None on file",
      referenceResponseRate: refRate,
      integrityStatus: score >= 70 ? "Strong" : score >= 40 ? "Moderate" : "Building",
      employmentTimelinePreview: (jobs ?? []).slice(0, 3).map((j: { company_name: string; job_title: string }) => ({ company_name: j.company_name, job_title: j.job_title })),
      url: `/employer/candidates/${p.id}`,
    });
  }

  const total = typeof count === "number" ? count : items.length;

  try {
    const { data: logData } = await sb.from("directory_search_logs").insert({
      employer_id: employerId,
      filters_used: f,
      results_count: items.length,
    }).select("id").single();
    const logId = (logData as { id?: string } | null)?.id;
    if (logId && resultIds.length > 0) {
      await sb.from("directory_search_result_profiles").insert(resultIds.map((profile_id: string) => ({ search_log_id: logId, profile_id })));
    }
  } catch {
    // non-fatal
  }

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
