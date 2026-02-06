/**
 * Auto-peer review engine. Generates 2–5 peer reviews from other employees and inserts into sandbox_peer_reviews.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const REVIEW_PHRASES = [
  "Strong performer with consistent delivery.",
  "Collaborative team player; goes above and beyond.",
  "Reliable under pressure; maintains quality.",
  "Excellent communication and leadership.",
  "Detail-oriented and dependable.",
  "Brings positive energy to the team.",
  "Handles deadlines well; good prioritization.",
  "Great mentor to junior team members.",
  "Proactive and solution-focused.",
  "Works well across departments.",
];

export type EmployeeForReview = { id: string };

export async function generatePeerReviews(params: {
  sandboxId: string;
  employeeId: string;
  employeePool: EmployeeForReview[];
}): Promise<{ ok: boolean; count: number; error?: string }> {
  const { sandboxId, employeeId, employeePool } = params;
  const others = employeePool.filter((e) => e.id !== employeeId);
  const count = Math.min(Math.max(2, Math.floor(Math.random() * 4) + 2), others.length);
  if (count === 0 || others.length === 0) return { ok: true, count: 0 };

  const supabase = getServiceRoleClient();
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  const rows = selected.map((reviewer) => {
    const rating_overall = Math.floor(Math.random() * 2) + 4;
    const reliability_score = Number((Math.random() * 0.3 + 0.7).toFixed(2));
    const teamwork_score = Number((Math.random() * 0.3 + 0.7).toFixed(2));
    const leadership_score = Number((Math.random() * 0.3 + 0.6).toFixed(2));
    const stress_performance_score = Number((Math.random() * 0.3 + 0.65).toFixed(2));
    const sentiment_score = (reliability_score + teamwork_score + leadership_score + stress_performance_score) / 4;
    const review_text = REVIEW_PHRASES[Math.floor(Math.random() * REVIEW_PHRASES.length)];

    return {
      sandbox_id: sandboxId,
      reviewer_id: reviewer.id,
      reviewed_id: employeeId,
      rating: rating_overall,
      review_text,
      sentiment_score,
      reliability_score,
      teamwork_score,
      leadership_score,
      stress_performance_score,
    };
  });

  const { error } = await supabase.from("sandbox_peer_reviews").insert(rows);
  if (error) {
    console.error("peerReviewGenerator:", error);
    return { ok: false, count: 0, error: error.message };
  }
  return { ok: true, count: rows.length };
}
