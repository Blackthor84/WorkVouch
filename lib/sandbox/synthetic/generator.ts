/**
 * Synthetic Population Generator - stress-test trust and overlap at scale. Data never leaves sandbox.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type SyntheticParams = {
  user_count: number;
  employer_count: number;
  overlap_density?: number;
  pct_malicious?: number;
  pct_collusion_clusters?: number;
  review_behavior?: "normal" | "sparse" | "brigade";
};

export async function generateSyntheticPopulation(params: {
  sandboxId: string;
  name?: string;
  params: SyntheticParams;
  createdBy?: string | null;
}): Promise<{ id: string; userCount: number; employerCount: number } | null> {
  const sb = getSupabaseServer();
  const cappedUsers = Math.min(Math.max(1, params.params.user_count), 5000);
  const cappedEmployers = Math.min(Math.max(1, params.params.employer_count), 500);

  const employers: { id: string }[] = [];
  for (let i = 0; i < cappedEmployers; i++) {
    const { data } = await sb.from("sandbox_employers").insert({
      sandbox_id: params.sandboxId,
      company_name: "Synthetic Corp " + (i + 1),
      industry: "technology",
      plan_tier: "pro",
    }).select("id").single();
    if (data) employers.push(data as { id: string });
  }

  const employees: { id: string }[] = [];
  for (let i = 0; i < cappedUsers; i++) {
    const { data } = await sb.from("sandbox_employees").insert({
      sandbox_id: params.sandboxId,
      full_name: "[SYNTHETIC] User " + (i + 1),
      industry: "technology",
    }).select("id").single();
    if (data) employees.push(data as { id: string });
  }

  for (let i = 0; i < employees.length; i++) {
    const empIndex = i % employers.length;
    const employerId = employers[empIndex]?.id;
    if (!employerId) continue;
    await sb.from("sandbox_employment_records").insert({
      sandbox_id: params.sandboxId,
      employee_id: employees[i]!.id,
      employer_id: employerId,
      role: "Synthetic Role",
      tenure_months: 12 + (i % 24),
      rehire_eligible: i % 5 !== 0,
    });
  }

  const { data: pop, error } = await sb.from("sandbox_synthetic_populations").insert({
    sandbox_id: params.sandboxId,
    name: params.name ?? "Synthetic",
    params: params.params,
    user_count: employees.length,
    employer_count: employers.length,
    created_by: params.createdBy ?? null,
  }).select("id, user_count, employer_count").single();

  if (error) return null;
  const row = pop as { id: string; user_count: number; employer_count: number };
  return { id: row.id, userCount: row.user_count, employerCount: row.employer_count };
}

export async function listSyntheticPopulations(sandboxId: string): Promise<{ id: string; name: string | null; user_count: number; employer_count: number; created_at: string }[]> {
  const sb = getSupabaseServer();
  const { data } = await sb.from("sandbox_synthetic_populations").select("id, name, user_count, employer_count, created_at").eq("sandbox_id", sandboxId).order("created_at", { ascending: false });
  return (data ?? []) as { id: string; name: string | null; user_count: number; employer_count: number; created_at: string }[];
}
