/**
 * Sandbox enterprise engine — uses canonical v1 intelligence engine only.
 * Loads sandbox data, builds ProfileInput, calls calculateProfileStrength("v1", input).
 * Sentiment-from-text remains for input derivation only; no scoring formulas here.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateProfileStrength } from "@/lib/intelligence/scoring";
import { buildSandboxProfileInput } from "./buildProfileInput";

/** Positive/negative words for sentiment: +1 / -1. Used only to derive input for v1 engine. */
const POSITIVE_WORDS = new Set(["excellent", "great", "reliable", "team", "recommend", "strong", "positive", "professional", "trustworthy"]);
const NEGATIVE_WORDS = new Set(["poor", "issues", "unreliable", "avoid", "weak", "negative", "unprofessional", "concerns"]);

function clamp0_100(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x * 10) / 10));
}

/** Sentiment from review text: 0–1. Used only to build ProfileInput; scoring is v1 engine. */
export function calculateSentimentFromText(reviewText: string | null): number {
  if (!reviewText?.trim()) return 0.5;
  const lower = reviewText.toLowerCase().split(/\s+/);
  let score = 0;
  for (const word of lower) {
    const w = word.replace(/\W/g, "");
    if (POSITIVE_WORDS.has(w)) score += 1;
    if (NEGATIVE_WORDS.has(w)) score -= 1;
  }
  const normalized = 0.5 + score * 0.1;
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Run sandbox scoring using canonical v1 engine only. Persist to sandbox_intelligence_outputs.
 */
export async function runEnterpriseEngine(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseServer();

  const [employeesRes, reviewsRes, recordsRes] = await Promise.all([
    supabase.from("sandbox_employees").select("id, industry").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_peer_reviews").select("reviewer_id, reviewed_id, rating, review_text, sentiment_score").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_employment_records").select("employee_id, tenure_months, rehire_eligible").eq("sandbox_id", sandboxId),
  ]);

  if (employeesRes.error) return { ok: false, error: employeesRes.error.message };
  if (reviewsRes.error) return { ok: false, error: reviewsRes.error.message };
  if (recordsRes.error) return { ok: false, error: recordsRes.error.message };

  const employees = employeesRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const records = recordsRes.data ?? [];

  const totalEmployees = employees.length;
  const uniqueConnections = new Set(reviews.map((r) => `${r.reviewer_id}-${r.reviewed_id}`)).size;
  const networkDensityBase = totalEmployees > 0 ? uniqueConnections / totalEmployees : 0;
  const networkDensityScore = clamp0_100(networkDensityBase * 100);

  const reviewsByReviewed = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const id = r.reviewed_id ?? "";
    if (!id) continue;
    if (!reviewsByReviewed.has(id)) reviewsByReviewed.set(id, []);
    reviewsByReviewed.get(id)!.push(r);
  }

  const recordsByEmployee = new Map<string, typeof records>();
  for (const r of records) {
    const id = r.employee_id;
    if (!recordsByEmployee.has(id)) recordsByEmployee.set(id, []);
    recordsByEmployee.get(id)!.push(r);
  }

  for (const emp of employees) {
    const empId = emp.id;
    const empReviews = reviewsByReviewed.get(empId) ?? [];
    const empRecords = recordsByEmployee.get(empId) ?? [];

    const input = buildSandboxProfileInput(empReviews, empRecords, calculateSentimentFromText);
    const profile_strength = calculateProfileStrength("v1", input);

    const network_density = networkDensityScore;
    const career_health = profile_strength;
    const risk_index = 100 - profile_strength;
    const team_fit = profile_strength;
    const hiring_confidence = profile_strength;

    const payload = {
      sandbox_id: sandboxId,
      employee_id: empId,
      profile_strength,
      career_health,
      risk_index,
      team_fit,
      hiring_confidence,
      network_density,
    };
    const { error } = await supabase.from("sandbox_intelligence_outputs").upsert(payload, { onConflict: "sandbox_id,employee_id" });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Alias for runEnterpriseEngine — single intelligence pipeline for sandbox. */
export async function runSandboxIntelligence(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  return runEnterpriseEngine(sandboxId);
}
