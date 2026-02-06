/**
 * Intelligence engine auto-trigger. Aggregates peer review averages and employment data,
 * calculates profile_strength, career_health, risk_index, team_fit, hiring_confidence, network_density,
 * upserts into sandbox_intelligence_outputs. NO mocked numbers — all from sandbox tables.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const POSITIVE_WORDS = new Set(["excellent", "great", "reliable", "team", "recommend", "strong", "positive", "professional", "trustworthy"]);
const NEGATIVE_WORDS = new Set(["poor", "issues", "unreliable", "avoid", "weak", "negative", "unprofessional", "concerns"]);

function clamp0_100(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x * 10) / 10));
}

function sentimentFromText(reviewText: string | null): number {
  if (!reviewText?.trim()) return 0.5;
  const lower = reviewText.toLowerCase().split(/\s+/);
  let score = 0;
  for (const word of lower) {
    const w = word.replace(/\W/g, "");
    if (POSITIVE_WORDS.has(w)) score += 1;
    if (NEGATIVE_WORDS.has(w)) score -= 1;
  }
  return Math.max(0, Math.min(1, 0.5 + score * 0.1));
}

export async function runSandboxIntelligenceRecalculation(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof sandboxId !== "string") {
    throw new Error("sandboxId must be a string");
  }
  const supabase = getServiceRoleClient();

  const [employeesRes, reviewsRes, recordsRes] = await Promise.all([
    supabase.from("sandbox_employees").select("id, industry").eq("sandbox_id", sandboxId),
    supabase.from("sandbox_peer_reviews").select("reviewer_id, reviewed_id, rating, review_text, sentiment_score, reliability_score, teamwork_score, leadership_score, stress_performance_score").eq("sandbox_id", sandboxId),
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
    if (!recordsByEmployee.has(r.employee_id)) recordsByEmployee.set(r.employee_id, []);
    recordsByEmployee.get(r.employee_id)!.push(r);
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

    const sentimentScores = empReviews.map((r) => {
      const fromCols = [r.reliability_score, r.teamwork_score, r.leadership_score, r.stress_performance_score].filter((x) => x != null) as number[];
      if (fromCols.length > 0) return fromCols.reduce((a, b) => a + b, 0) / fromCols.length;
      return r.sentiment_score ?? sentimentFromText(r.review_text);
    });
    const avg_sentiment = sentimentScores.length > 0 ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length : 0.5;
    const negative_sentiment_weight = (1 - avg_sentiment) * 15;
    const employment_gaps_penalty = empRecords.length === 0 ? 10 : 0;

    const profile_strength = clamp0_100(
      (average_rating * 20) + (rehire_bonus * 15) + (tenure_score * 0.4) + (review_volume_score * 10)
    );
    const low_dispute_bonus = avg_sentiment > 0.5 ? 1 : 0.5;
    const career_health = clamp0_100(
      (tenure_score * 0.5) + (networkDensityScore * 0.3) + (low_dispute_bonus * 20)
    );
    const risk_index = clamp0_100(
      100 - profile_strength + employment_gaps_penalty + negative_sentiment_weight
    );
    const network_density = networkDensityScore;
    const rehire_eligible_bonus = rehire_bonus * 15;
    const team_fit = clamp0_100(
      (emp.industry ? 20 : 0) + (average_rating * 10) + rehire_eligible_bonus
    );
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
    const { error } = await supabase.from("sandbox_intelligence_outputs").upsert(payload, { onConflict: "sandbox_id,employee_id" });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}
