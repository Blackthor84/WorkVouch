/**
 * Trust Score Engine — server-side only. Never calculate on frontend.
 * Single portable core score per user (0–100). Stored in trust_scores.
 * All scoring uses @/lib/core/intelligence only. No duplicate math.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  buildProductionProfileInput,
  calculateProfileStrength,
  logIntel,
  LOG_TAGS,
  insertScoreHistory,
  insertHealthEvent,
} from "@/lib/core/intelligence";

const MAX_SCORE = 100;
const MIN_SCORE = 0;

/** Raw component values fetched from DB (for display only; scoring is in core/intelligence). */
export interface TrustScoreComponents {
  verifiedEmployments: number;
  totalVerifiedYears: number;
  averageReferenceRating: number;
  referenceCount: number;
  uniqueEmployersWithReferences: number;
  fraudFlagsCount: number;
}

/**
 * Fetch raw trust score components for a user from DB.
 */
export async function getTrustScoreComponents(
  userId: string
): Promise<TrustScoreComponents> {
  const sb = getSupabaseServer();

  const { data: records } = await sb
    .from("employment_records")
    .select("start_date, end_date")
    .eq("user_id", userId)
    .eq("verification_status", "verified");
  const verifiedList = (records ?? []) as {
    start_date: string;
    end_date: string | null;
  }[];
  const verifiedEmployments = verifiedList.length;
  const now = new Date();
  let totalVerifiedYears = 0;
  for (const r of verifiedList) {
    const start = new Date(r.start_date);
    const end = r.end_date ? new Date(r.end_date) : now;
    totalVerifiedYears +=
      (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }

  const { data: refs } = await sb
    .from("employment_references")
    .select("rating, employment_match_id")
    .eq("reviewed_user_id", userId);
  const refList = (refs ?? []) as { rating: number; employment_match_id: string }[];
  const referenceCount = refList.length;
  const averageReferenceRating =
    referenceCount > 0
      ? refList.reduce((s, r) => s + r.rating, 0) / referenceCount
      : 0;

  let uniqueEmployersWithReferences = 0;
  if (refList.length > 0) {
    const matchIds = [...new Set(refList.map((r) => r.employment_match_id))];
    const { data: matches } = await sb
      .from("employment_matches")
      .select("employment_record_id")
      .in("id", matchIds);
    const matchesList = (matches ?? []) as { employment_record_id: string }[];
    const recordIds = matchesList.map((m) => m.employment_record_id);
    const { data: recs } = await sb
      .from("employment_records")
      .select("company_normalized")
      .eq("user_id", userId)
      .in("id", recordIds);
    const recsList = (recs ?? []) as { company_normalized: string }[];
    const distinctCompanies = new Set(recsList.map((r) => r.company_normalized));
    uniqueEmployersWithReferences = distinctCompanies.size;
  }

  const { count: fraudCount } = await sb
    .from("fraud_flags")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const fraudFlagsCount = fraudCount ?? 0;

  return {
    verifiedEmployments,
    totalVerifiedYears,
    averageReferenceRating,
    referenceCount,
    uniqueEmployersWithReferences,
    fraudFlagsCount,
  };
}

/**
 * Calculate the core trust score for a user and persist to trust_scores.
 * Uses canonical v1 intelligence engine only. Concurrency: re-fetch version, update only if match, retry once on conflict.
 */
export async function calculateCoreTrustScore(userId: string): Promise<{
  score: number;
  components: TrustScoreComponents;
  previousScore: number | null;
}> {
  const startMs = Date.now();
  logIntel({
    tag: LOG_TAGS.INTEL_START,
    context: "trust_score",
    userId,
  });

  const components = await getTrustScoreComponents(userId);
  const input = await buildProductionProfileInput(userId);
  const score = Math.max(
    MIN_SCORE,
    Math.min(MAX_SCORE, calculateProfileStrength("v1", input))
  );

  const sb = getSupabaseServer();
  const newVersion = crypto.randomUUID();

  const { data: existing } = await sb
    .from("trust_scores")
    .select("version, score")
    .eq("user_id", userId)
    .maybeSingle();
  const existingRow = existing as { version?: string; score?: number } | null;
  const currentVersion = existingRow?.version ?? null;
  const previousScore =
    existingRow?.score != null ? Number(existingRow.score) : null;

  const payload = {
    user_id: userId,
    score,
    job_count: components.verifiedEmployments,
    reference_count: components.referenceCount,
    average_rating: components.averageReferenceRating,
    calculated_at: new Date().toISOString(),
    version: newVersion,
  };

  const tryWrite = async (): Promise<boolean> => {
    if (currentVersion === null) {
      const { error } = await sb
        .from("trust_scores")
        .upsert(payload, { onConflict: "user_id" });
      if (error) {
        logIntel({
          tag: LOG_TAGS.INTEL_FAIL,
          context: "trust_score_upsert",
          userId,
          error: String(error),
          durationMs: Date.now() - startMs,
        });
        throw new Error(`Trust score write failed: ${error.message}`);
      }
      return true;
    }
    const { data: updated, error } = await sb
      .from("trust_scores")
      .update(payload)
      .eq("user_id", userId)
      .eq("version", currentVersion)
      .select("user_id")
      .maybeSingle();
    if (error) {
      logIntel({
        tag: LOG_TAGS.INTEL_FAIL,
        context: "trust_score_update",
        userId,
        error: String(error),
        durationMs: Date.now() - startMs,
      });
      insertHealthEvent({
        event_type: "recalc_fail",
        payload: { userId, error: String(error), context: "trust_score_update" },
      }).catch(() => {});
      throw new Error(`Trust score write failed: ${error.message}`);
    }
    return !!updated;
  };

  let written = await tryWrite();
  if (!written && currentVersion !== null) {
    const { data: refetched } = await sb
      .from("trust_scores")
      .select("version")
      .eq("user_id", userId)
      .maybeSingle();
    const refetchedVersion = (refetched as { version?: string } | null)?.version ?? null;
    if (refetchedVersion !== null && refetchedVersion !== currentVersion) {
      const retryPayload = {
        ...payload,
        version: crypto.randomUUID(),
      };
      const { error } = await sb
        .from("trust_scores")
        .update(retryPayload)
        .eq("user_id", userId)
        .eq("version", refetchedVersion);
      if (error) {
        logIntel({
          tag: LOG_TAGS.INTEL_FAIL,
          context: "trust_score_retry",
          userId,
          error: String(error),
          durationMs: Date.now() - startMs,
        });
        throw new Error(`Trust score write failed: ${error.message}`);
      }
      written = true;
    }
  }
  if (!written && currentVersion !== null) {
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "trust_score_concurrent",
      userId,
      durationMs: Date.now() - startMs,
    });
    insertHealthEvent({
      event_type: "recalc_fail",
      payload: {
        userId,
        error: "concurrent update",
        context: "trust_score_concurrent",
      },
    }).catch(() => {});
    throw new Error("Trust score write skipped due to concurrent update; retry later.");
  }

  logIntel({
    tag: LOG_TAGS.INTEL_SUCCESS,
    context: "trust_score",
    userId,
    durationMs: Date.now() - startMs,
  });

  return { score, components, previousScore };
}

/**
 * Recalculate and persist core trust score; log to audit_logs and intelligence_score_history.
 * Call after: match confirmation, reference submission, fraud flag change, dispute resolution.
 */
export async function recalculateTrustScore(
  userId: string,
  triggeredBy?: string | null
): Promise<{ score: number }> {
  const { score, components, previousScore } =
    await calculateCoreTrustScore(userId);

  const sb = getSupabaseServer();
  await sb.from("audit_logs").insert({
    entity_type: "trust_score",
    entity_id: userId,
    changed_by: triggeredBy ?? userId,
    new_value: {
      score,
      verified_employments: components.verifiedEmployments,
      reference_count: components.referenceCount,
    },
    change_reason: "trust_score_recalculation",
  });

  await insertScoreHistory({
    entity_type: "trust_score",
    user_id: userId,
    previous_score: previousScore,
    new_score: score,
    reason: "trust_score_recalculation",
    triggered_by: triggeredBy ?? userId,
  }).catch(() => {});

  await insertHealthEvent({
    event_type: "recalc_success",
    payload: {
      userId,
      previousScore,
      newScore: score,
      context: "trust_score",
    },
  }).catch(() => {});

  return { score };
}
