/**
 * Sandbox Intelligence Engine — fully isolated from production.
 * Reads only sandbox_* tables; writes only to sandbox_intelligence_outputs.
 * Never uses production intelligence tables.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

function sb() {
  return getSupabaseServer() as { from: (table: string) => { select: (q: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }> }; insert: (row: unknown) => Promise<{ error: unknown }>; upsert: (row: unknown, opts: { onConflict: string }) => Promise<{ error: unknown }> } };
}

/** Positive/negative keyword weights for sentiment (simple scoring) */
const SENTIMENT_KEYWORDS: Record<string, number> = {
  excellent: 1.2, great: 1.1, reliable: 1.0, team: 0.9, recommend: 1.0,
  poor: -1.2, issues: -1.0, unreliable: -0.9, avoid: -1.1,
};

/**
 * Calculate peer sentiment from reviews: rating average, keyword weighting, review volume.
 */
function calculatePeerSentiment(
  ratingAvg: number,
  reviewTexts: string[],
  reviewCount: number
): number {
  let keywordScore = 0;
  let keywordHits = 0;
  const lower = reviewTexts.map((t) => (t || "").toLowerCase());
  for (const text of lower) {
    for (const [word, weight] of Object.entries(SENTIMENT_KEYWORDS)) {
      if (text.includes(word)) {
        keywordScore += weight;
        keywordHits++;
      }
    }
  }
  const keywordComponent = keywordHits > 0 ? (keywordScore / keywordHits + 1) / 2 : 0.5;
  const ratingNorm = Math.min(1, Math.max(0, ratingAvg / 5));
  const volumeBonus = Math.min(0.2, reviewCount * 0.02);
  return Math.min(1, Math.max(0, ratingNorm * 0.6 + keywordComponent * 0.3 + volumeBonus));
}

/**
 * Compute profile_strength from employment records + peer review count + sentiment.
 */
function computeProfileStrength(
  employmentCount: number,
  peerReviewCount: number,
  sentiment: number
): number {
  const base = Math.min(100, 20 + employmentCount * 10 + peerReviewCount * 5);
  return Math.min(100, base * (0.7 + sentiment * 0.3));
}

/**
 * Compute risk_index (higher = riskier). Inverse of stability + rehire + sentiment.
 */
function computeRiskIndex(
  rehireEligiblePct: number,
  sentiment: number,
  employmentCount: number
): number {
  const stability = rehireEligiblePct * 0.5 + sentiment * 0.3 + Math.min(0.2, employmentCount * 0.02);
  return Math.round(100 * (1 - stability));
}

/**
 * Compute network_density from peer review volume and employee count.
 */
function computeNetworkDensity(peerReviewCount: number, employeeCount: number): number {
  if (employeeCount <= 0) return 0;
  const density = (peerReviewCount / Math.max(1, employeeCount)) * 15;
  return Math.min(100, Math.round(density));
}

/**
 * Compute team_fit from sentiment and employment tenure.
 */
function computeTeamFit(sentiment: number, avgTenureMonths: number): number {
  const tenureScore = Math.min(1, avgTenureMonths / 24) * 0.4;
  return Math.min(100, Math.round((sentiment * 0.6 + tenureScore) * 100));
}

/**
 * Compute hiring_confidence composite from profile strength, risk, team fit, network.
 */
function computeHiringConfidence(
  profileStrength: number,
  riskIndex: number,
  teamFit: number,
  networkDensity: number
): number {
  const riskPenalty = (riskIndex / 100) * 30;
  const composite = (profileStrength * 0.25 + (100 - riskIndex) * 0.25 + teamFit * 0.25 + networkDensity * 0.25) - riskPenalty;
  return Math.min(100, Math.max(0, Math.round(composite)));
}

/**
 * Run the sandbox intelligence engine for a session and persist to sandbox_intelligence_outputs only.
 */
export async function runSandboxIntelligence(sandboxId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSandboxClient();

  const [
    employeesRes,
    reviewsRes,
    recordsRes,
  ] = await Promise.all([
    (supabase.from("sandbox_employees") as any).select("*").eq("sandbox_id", sandboxId),
    (supabase.from("sandbox_peer_reviews") as any).select("*").eq("sandbox_id", sandboxId),
    (supabase.from("sandbox_employment_records") as any).select("*").eq("sandbox_id", sandboxId),
  ]);

  const employees = (employeesRes.data ?? []) as { id: string }[];
  const reviews = (reviewsRes.data ?? []) as { reviewer_id: string; reviewed_id: string; rating: number | null; review_text: string | null; sentiment_score: number | null }[];
  const records = (recordsRes.data ?? []) as { employee_id: string; employer_id: string; tenure_months: number | null; rehire_eligible: boolean | null }[];

  const employeeIds = new Set(employees.map((e) => e.id));
  const rehireByEmployee = new Map<string, boolean>();
  const tenureByEmployee = new Map<string, number[]>();
  for (const r of records) {
    rehireByEmployee.set(r.employee_id, r.rehire_eligible ?? false);
    if (!tenureByEmployee.has(r.employee_id)) tenureByEmployee.set(r.employee_id, []);
    tenureByEmployee.get(r.employee_id)!.push(r.tenure_months ?? 0);
  }

  const reviewsByReviewed = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const id = r.reviewed_id;
    if (!reviewsByReviewed.has(id)) reviewsByReviewed.set(id, []);
    reviewsByReviewed.get(id)!.push(r);
  }

  for (const emp of employees) {
    const empId = emp.id;
    const empReviews = reviewsByReviewed.get(empId) ?? [];
    const ratingAvg = empReviews.length > 0
      ? empReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / empReviews.length
      : 0;
    const reviewTexts = empReviews.map((r) => r.review_text ?? "").filter(Boolean);
    const sentiment = calculatePeerSentiment(ratingAvg, reviewTexts, empReviews.length);

    const employmentCount = records.filter((r) => r.employee_id === empId).length;
    const rehireCount = records.filter((r) => r.employee_id === empId && r.rehire_eligible).length;
    const rehireEligiblePct = employmentCount > 0 ? rehireCount / employmentCount : 0.5;
    const tenures = tenureByEmployee.get(empId) ?? [];
    const avgTenureMonths = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

    const profileStrength = computeProfileStrength(employmentCount, empReviews.length, sentiment);
    const riskIndex = computeRiskIndex(rehireEligiblePct, sentiment, employmentCount);
    const networkDensity = computeNetworkDensity(reviews.length, employees.length);
    const teamFit = computeTeamFit(sentiment, avgTenureMonths);
    const careerHealth = Math.min(100, Math.round(sentiment * 100));
    const hiringConfidence = computeHiringConfidence(profileStrength, riskIndex, teamFit, networkDensity);

    const payload = {
      sandbox_id: sandboxId,
      employee_id: empId,
      profile_strength: profileStrength,
      career_health: careerHealth,
      risk_index: riskIndex,
      team_fit: teamFit,
      hiring_confidence: hiringConfidence,
      network_density: networkDensity,
    };
    const { error } = await supabase.from("sandbox_intelligence_outputs").upsert(payload, { onConflict: "sandbox_id,employee_id" }) as Promise<{ error: unknown }>;
    if (error) {
      return { ok: false, error: (error as { message?: string }).message ?? String(error) };
    }
  }

  return { ok: true };
}
