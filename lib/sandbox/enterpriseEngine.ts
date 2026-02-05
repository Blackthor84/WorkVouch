/**
 * Enterprise Simulation Intelligence Engine — real math, sandbox_* tables only.
 * Persists to sandbox_intelligence_outputs. Never touches production.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const sb = () => getSupabaseServer() as any;

/** Positive/negative words for sentiment: +1 / -1 */
const POSITIVE_WORDS = new Set(["excellent", "great", "reliable", "team", "recommend", "strong", "positive", "professional", "trustworthy"]);
const NEGATIVE_WORDS = new Set(["poor", "issues", "unreliable", "avoid", "weak", "negative", "unprofessional", "concerns"]);

function clamp0_100(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x * 10) / 10));
}

/** Sentiment from review text: positive +1, negative -1, normalized to 0–1 */
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
 * Run enterprise scoring and persist to sandbox_intelligence_outputs.
 * Formulas:
 * - Profile Strength: (average_rating * 20) + (rehire_bonus * 15) + (tenure_score * 0.4) + (review_volume_score * 10), clamp 0–100
 * - Career Health: (tenure_score * 0.5) + (network_density * 30) + (low_dispute_bonus * 20)
 * - Risk Index: 100 - profile_strength + employment_gaps_penalty + negative_sentiment_weight
 * - Network Density: unique_review_connections / total_employees (scale to 0–100)
 * - Team Fit: industry_match ? 20 : 0 + average_rating * 10 + rehire_eligible_bonus
 * - Hiring Confidence: (profile_strength * 0.4) + (team_fit * 0.3) + (100 - risk_index) * 0.3
 */
export async function runEnterpriseEngine(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = sb();

  const [employeesRes, reviewsRes, recordsRes] = await Promise.all([
    supabase.from("sandbox_employees").select("id, industry").eq("sandbox_id", sandboxId) as Promise<{ data: unknown; error: unknown }>,
    supabase.from("sandbox_peer_reviews").select("reviewer_id, reviewed_id, rating, review_text, sentiment_score").eq("sandbox_id", sandboxId) as Promise<{ data: unknown; error: unknown }>,
    supabase.from("sandbox_employment_records").select("employee_id, tenure_months, rehire_eligible").eq("sandbox_id", sandboxId) as Promise<{ data: unknown; error: unknown }>,
  ]);

  const employees = (employeesRes.data ?? []) as { id: string; industry?: string | null }[];
  const reviews = (reviewsRes.data ?? []) as { reviewer_id: string; reviewed_id: string; rating: number | null; review_text: string | null; sentiment_score: number | null }[];
  const records = (recordsRes.data ?? []) as { employee_id: string; tenure_months: number | null; rehire_eligible: boolean | null }[];

  const totalEmployees = employees.length;
  const uniqueConnections = new Set(reviews.map((r) => `${r.reviewer_id}-${r.reviewed_id}`)).size;
  const networkDensityBase = totalEmployees > 0 ? uniqueConnections / totalEmployees : 0;
  const networkDensityScore = clamp0_100(networkDensityBase * 100);

  const reviewsByReviewed = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const id = r.reviewed_id;
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

    const average_rating = empReviews.length > 0
      ? empReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / empReviews.length
      : 0;
    const rehire_count = empRecords.filter((r) => r.rehire_eligible === true).length;
    const rehire_bonus = empRecords.length > 0 ? rehire_count / empRecords.length : 0;
    const tenure_months = empRecords.length > 0
      ? empRecords.reduce((s, r) => s + (r.tenure_months ?? 0), 0) / empRecords.length
      : 0;
    const tenure_score = Math.min(100, tenure_months * 2);
    const review_volume_score = Math.min(10, empReviews.length * 2);
    const sentimentScores = empReviews.map((r) => r.sentiment_score ?? calculateSentimentFromText(r.review_text));
    const avg_sentiment = sentimentScores.length > 0 ? sentimentScores.reduce((a, b) => a + (b ?? 0.5), 0) / sentimentScores.length : 0.5;
    const negative_sentiment_weight = (1 - avg_sentiment) * 15;
    const employment_gaps_penalty = empRecords.length === 0 ? 10 : 0;

    // Profile Strength: (average_rating * 20) + (rehire_bonus * 15) + (tenure_score * 0.4) + (review_volume_score * 10), clamp 0–100
    const profile_strength = clamp0_100(
      (average_rating * 20) + (rehire_bonus * 15) + (tenure_score * 0.4) + (review_volume_score * 10)
    );

    // Career Health: (tenure_score * 0.5) + (network_density * 30) + (low_dispute_bonus * 20)
    const low_dispute_bonus = avg_sentiment > 0.5 ? 1 : 0.5;
    const career_health = clamp0_100(
      (tenure_score * 0.5) + (networkDensityScore * 0.3) + (low_dispute_bonus * 20)
    );

    // Risk Index: 100 - profile_strength + employment_gaps_penalty + negative_sentiment_weight
    const risk_index = clamp0_100(
      100 - profile_strength + employment_gaps_penalty + negative_sentiment_weight
    );

    // Network Density: unique_review_connections / total_employees (already computed as networkDensityScore for this employee's context we use global)
    const network_density = networkDensityScore;

    // Team Fit: industry_match ? 20 : 0 + average_rating * 10 + rehire_eligible_bonus
    const rehire_eligible_bonus = rehire_bonus * 15;
    const team_fit = clamp0_100(
      (emp.industry ? 20 : 0) + (average_rating * 10) + rehire_eligible_bonus
    );

    // Hiring Confidence: (profile_strength * 0.4) + (team_fit * 0.3) + (100 - risk_index) * 0.3
    const hiring_confidence = clamp0_100(
      (profile_strength * 0.4) + (team_fit * 0.3) + (100 - risk_index) * 0.3
    );

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
    const { error } = await supabase.from("sandbox_intelligence_outputs").upsert(payload, { onConflict: "sandbox_id,employee_id" }) as Promise<{ error: unknown }>;
    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? String(error) };
    }
  }

  return { ok: true };
}
