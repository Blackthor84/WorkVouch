/**
 * Process a single peer review: extract behavioral signals, persist review_intelligence, update vector.
 * Called after employment_references insert. Never blocks; fail silently with logs.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { extractBehavioralSignals } from "./behavioralEngine";
import { updateBehavioralVector } from "./updateBehavioralVector";
import { scheduleBaselineRecalcForCandidate } from "./scheduleBaselineRecalc";

function safeLog(err: unknown): void {
  try {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.error) {
      console.error("[processReviewIntelligence]", err);
    }
  } catch {
    // no-op
  }
}

/**
 * Fetch review text (employment_references.comment), extract signals, insert review_intelligence, recalc vector.
 * reviewId = employment_references.id. candidateId = reviewed_user_id.
 */
export async function processReviewIntelligence(reviewId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const { data: ref, error: fetchError } = await supabase
      .from("employment_references")
      .select("id, comment, reviewed_user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !ref) {
      safeLog(fetchError || "review not found");
      return;
    }

    const candidateId = (ref as { reviewed_user_id?: string }).reviewed_user_id;
    const comment = (ref as { comment?: string | null }).comment ?? "";
    if (!candidateId) return;

    const signals = await extractBehavioralSignals(comment);
    if (!signals) return;

    const row = {
      review_id: reviewId,
      candidate_id: candidateId,
      sentiment_score: signals.sentiment_score,
      pressure_score: signals.pressure_score,
      structure_score: signals.structure_score,
      communication_score: signals.communication_score,
      leadership_score: signals.leadership_score,
      reliability_score: signals.reliability_score,
      initiative_score: signals.initiative_score,
      conflict_indicator: signals.conflict_indicator,
      tone_variance_score: signals.tone_variance_score,
      anomaly_score: signals.anomaly_score,
      extraction_confidence: signals.extraction_confidence,
      model_version: signals.model_version,
    };
    const { data: existing } = await supabase
      .from("review_intelligence")
      .select("id")
      .eq("review_id", reviewId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("review_intelligence").update(row).eq("id", existing.id);
    } else {
      await supabase.from("review_intelligence").insert(row);
    }

    await updateBehavioralVector(candidateId);
    scheduleBaselineRecalcForCandidate(candidateId);
  } catch (e) {
    safeLog(e);
  }
}
