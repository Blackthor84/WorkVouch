/**
 * Process a single peer review: extract behavioral signals, persist review_intelligence, update vector.
 * Called after employment_references insert. Returns result; callers must return non-200 on failure.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { extractBehavioralSignals } from "./behavioralEngine";
import { updateBehavioralVector } from "./updateBehavioralVector";
import { scheduleBaselineRecalcForCandidate } from "./scheduleBaselineRecalc";
import { logIntel, LOG_TAGS } from "@/lib/core/intelligence";

export interface ProcessReviewIntelligenceResult {
  ok: boolean;
  error?: string;
}

/**
 * Fetch review text (employment_references.comment), extract signals, insert review_intelligence, recalc vector.
 * reviewId = employment_references.id. candidateId = reviewed_user_id.
 * On failure: logs structured INTEL_FAIL, returns { ok: false, error }. Caller must return non-200 and surface warning.
 */
export async function processReviewIntelligence(
  reviewId: string
): Promise<ProcessReviewIntelligenceResult> {
  const startMs = Date.now();
  logIntel({
    tag: LOG_TAGS.INTEL_START,
    context: "process_review_intelligence",
    reviewId,
  });

  try {
    const supabase = getSupabaseServer();
    const { data: ref, error: fetchError } = await supabase
      .from("employment_references")
      .select("id, comment, reviewed_user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !ref) {
      const errMsg = fetchError?.message ?? "review not found";
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "process_review_intelligence",
        reviewId,
        error: errMsg,
        durationMs: Date.now() - startMs,
      });
      return { ok: false, error: errMsg };
    }

    const candidateId = (ref as { reviewed_user_id?: string }).reviewed_user_id;
    const comment = (ref as { comment?: string | null }).comment ?? "";
    if (!candidateId) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "process_review_intelligence",
        reviewId,
        error: "missing reviewed_user_id",
        durationMs: Date.now() - startMs,
      });
      return { ok: false, error: "missing reviewed_user_id" };
    }

    const signals = await extractBehavioralSignals(comment);
    if (!signals) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "process_review_intelligence",
        reviewId,
        error: "extractBehavioralSignals returned null",
        durationMs: Date.now() - startMs,
      });
      return { ok: false, error: "extractBehavioralSignals returned null" };
    }

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
    const { data: existing, error: upsertError } = await supabase
      .from("review_intelligence")
      .select("id")
      .eq("review_id", reviewId)
      .maybeSingle();

    if (upsertError) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "process_review_intelligence",
        reviewId,
        error: upsertError.message,
        durationMs: Date.now() - startMs,
      });
      return { ok: false, error: upsertError.message };
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("review_intelligence")
        .update(row)
        .eq("id", existing.id);
      if (updateError) {
        logIntel({
          tag: LOG_TAGS.INTEL_FAIL,
          context: "process_review_intelligence",
          reviewId,
          error: updateError.message,
          durationMs: Date.now() - startMs,
        });
        return { ok: false, error: updateError.message };
      }
    } else {
      const { error: insertError } = await supabase
        .from("review_intelligence")
        .insert(row);
      if (insertError) {
        logIntel({
          tag: LOG_TAGS.INTEL_FAIL,
          context: "process_review_intelligence",
          reviewId,
          error: insertError.message,
          durationMs: Date.now() - startMs,
        });
        return { ok: false, error: insertError.message };
      }
    }

    const vectorResult = await updateBehavioralVector(candidateId).then(
      () => ({ ok: true as const }),
      (e) => ({ ok: false as const, error: String(e) })
    );
    if (!vectorResult.ok) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "process_review_intelligence",
        reviewId,
        error: vectorResult.error,
        durationMs: Date.now() - startMs,
      });
      return { ok: false, error: vectorResult.error };
    }

    scheduleBaselineRecalcForCandidate(candidateId).catch((error) => { console.error("[SYSTEM_FAIL]", error); });

    logIntel({
      tag: LOG_TAGS.INTEL_SUCCESS,
      context: "process_review_intelligence",
      reviewId,
      durationMs: Date.now() - startMs,
    });
    return { ok: true };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "process_review_intelligence",
      reviewId,
      error: errMsg,
      durationMs: Date.now() - startMs,
    });
    return { ok: false, error: errMsg };
  }
}
