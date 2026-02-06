/**
 * Central sandbox generator engine. All inserts include sandbox_id.
 * Each function inserts into the correct sandbox table and returns the inserted row.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateSentimentFromText } from "@/lib/sandbox/enterpriseEngine";

const PLAN_VALUE = 99;
const ASSUMED_CONVERSION_VALUE = 150;

export type GenerateEmployerOpts = {
  company_name?: string;
  industry?: string | null;
  plan_tier?: string;
};

export async function generateEmployer(
  sandboxId: string,
  opts: GenerateEmployerOpts = {}
): Promise<{ ok: true; row: { id: string; company_name: string | null; industry: string | null; plan_tier: string | null } } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("sandbox_employers")
    .insert({
      sandbox_id: sandboxId,
      company_name: opts.company_name ?? "Sandbox Company",
      industry: opts.industry ?? null,
      plan_tier: opts.plan_tier ?? "pro",
    })
    .select("id, company_name, industry, plan_tier")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}

export type GenerateEmployeeOpts = {
  full_name?: string;
  industry?: string | null;
};

export async function generateEmployee(
  sandboxId: string,
  opts: GenerateEmployeeOpts = {}
): Promise<{ ok: true; row: { id: string; full_name: string | null; industry: string | null } } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("sandbox_employees")
    .insert({
      sandbox_id: sandboxId,
      full_name: opts.full_name ?? "Sandbox Employee",
      industry: opts.industry ?? null,
    })
    .select("id, full_name, industry")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}

export type GenerateEmploymentRecordOpts = {
  role?: string | null;
  tenure_months?: number | null;
  rehire_eligible?: boolean;
};

export async function generateEmploymentRecord(
  sandboxId: string,
  employeeId: string,
  employerId: string,
  opts: GenerateEmploymentRecordOpts = {}
): Promise<{ ok: true; row: { id: string } } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("sandbox_employment_records")
    .insert({
      sandbox_id: sandboxId,
      employee_id: employeeId,
      employer_id: employerId,
      role: opts.role ?? null,
      tenure_months: opts.tenure_months ?? null,
      rehire_eligible: opts.rehire_eligible ?? true,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}

export type GeneratePeerReviewOpts = {
  rating?: number;
  review_text?: string | null;
};

export async function generatePeerReview(
  sandboxId: string,
  reviewerId: string,
  reviewedId: string,
  opts: GeneratePeerReviewOpts = {}
): Promise<{ ok: true; row: { id: string; rating: number | null; sentiment_score: number | null } } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  const rating = opts.rating != null ? Math.max(1, Math.min(5, opts.rating)) : 3;
  const sentiment_score = calculateSentimentFromText(opts.review_text ?? null);
  const { data, error } = await supabase
    .from("sandbox_peer_reviews")
    .insert({
      sandbox_id: sandboxId,
      reviewer_id: reviewerId,
      reviewed_id: reviewedId,
      rating,
      review_text: opts.review_text ?? null,
      sentiment_score,
    })
    .select("id, rating, sentiment_score")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}

export type GenerateAdSimulationOpts = {
  employer_id?: string | null;
  impressions?: number;
  clicks?: number;
  spend?: number;
};

export async function generateAdSimulation(
  sandboxId: string,
  opts: GenerateAdSimulationOpts = {}
): Promise<{ ok: true; row: { id: string; impressions: number; clicks: number; spend: number | null; roi: number | null } } | { ok: false; error: string }> {
  const supabase = getSupabaseServer();
  const impressions = opts.impressions ?? 0;
  const clicks = opts.clicks ?? 0;
  const spend = opts.spend ?? 0;
  const roi = spend > 0 ? (clicks * ASSUMED_CONVERSION_VALUE - spend) / spend : 0;
  const { data, error } = await supabase
    .from("sandbox_ads")
    .insert({
      sandbox_id: sandboxId,
      employer_id: opts.employer_id ?? null,
      impressions,
      clicks,
      spend,
      roi,
    })
    .select("id, impressions, clicks, spend, roi")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data };
}
