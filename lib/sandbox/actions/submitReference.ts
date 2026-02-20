/**
 * Server-side submit sandbox peer reference. Used by peer-reviews API and DSL action registry.
 * Real business logic: validation, insert, runSandboxIntelligence, calculateSandboxMetrics.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import {
  calculateSentimentFromText,
  runSandboxIntelligence,
} from "@/lib/sandbox/enterpriseEngine";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { logIntel, LOG_TAGS, insertHealthEvent } from "@/lib/core/intelligence";

const MIN_OVERLAP_MONTHS = 1;

export type SubmitSandboxReferenceParams = {
  sandbox_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating?: number;
  review_text?: string | null;
};

export type SubmitSandboxReferenceResult =
  | { ok: true; review: { id: string; rating: number; sentiment_score: number | null } }
  | { ok: false; status: number; error: string };

export async function submitSandboxReference(
  params: SubmitSandboxReferenceParams
): Promise<SubmitSandboxReferenceResult> {
  const { sandbox_id, reviewer_id, reviewed_id } = params;
  const rating =
    typeof params.rating === "number"
      ? Math.max(1, Math.min(5, params.rating))
      : 3;
  const review_text = params.review_text ?? null;

  if (!sandbox_id || !reviewer_id || !reviewed_id) {
    return {
      ok: false,
      status: 400,
      error: "Missing sandbox_id, reviewer_id, or reviewed_id",
    };
  }

  const supabase = getServiceRoleClient();

  if (reviewer_id === reviewed_id) {
    logIntel({
      tag: LOG_TAGS.FRAUD_BLOCK,
      context: "sandbox_peer_review_self",
      sandboxId: sandbox_id,
      reviewerId: reviewer_id,
      reviewedId: reviewed_id,
    });
    try {
      await insertHealthEvent({
        event_type: "fraud_block",
        payload: {
          context: "sandbox_peer_review_self",
          sandboxId: sandbox_id,
          reviewerId: reviewer_id,
          reviewedId: reviewed_id,
        },
      });
    } catch {
      /* ignore */
    }
    return { ok: false, status: 400, error: "Self-review is not allowed" };
  }

  const { data: existing } = await supabase
    .from("sandbox_peer_reviews")
    .select("id")
    .eq("sandbox_id", sandbox_id)
    .eq("reviewer_id", reviewer_id)
    .eq("reviewed_id", reviewed_id)
    .maybeSingle();
  if (existing?.id) {
    logIntel({
      tag: LOG_TAGS.FRAUD_BLOCK,
      context: "sandbox_peer_review_duplicate",
      sandboxId: sandbox_id,
      reviewerId: reviewer_id,
      reviewedId: reviewed_id,
    });
    return {
      ok: false,
      status: 409,
      error: "One review per coworker per overlap; duplicate not allowed",
    };
  }

  const { data: reviewerEmp } = await supabase
    .from("sandbox_employees")
    .select("id, sandbox_id")
    .eq("id", reviewer_id)
    .eq("sandbox_id", sandbox_id)
    .maybeSingle();
  if (!reviewerEmp?.id) {
    return {
      ok: false,
      status: 400,
      error: "Reviewer employee not found or sandbox_id mismatch",
    };
  }

  const { data: reviewedEmp } = await supabase
    .from("sandbox_employees")
    .select("id, sandbox_id")
    .eq("id", reviewed_id)
    .eq("sandbox_id", sandbox_id)
    .maybeSingle();
  if (!reviewedEmp?.id) {
    return {
      ok: false,
      status: 400,
      error: "Reviewed employee not found or sandbox_id mismatch",
    };
  }

  const { data: reviewerRecords } = await supabase
    .from("sandbox_employment_records")
    .select("employer_id, tenure_months")
    .eq("sandbox_id", sandbox_id)
    .eq("employee_id", reviewer_id);
  const { data: reviewedRecords } = await supabase
    .from("sandbox_employment_records")
    .select("employer_id, tenure_months")
    .eq("sandbox_id", sandbox_id)
    .eq("employee_id", reviewed_id);

  const reviewerList = (reviewerRecords ?? []) as {
    employer_id: string;
    tenure_months: number | null;
  }[];
  const reviewedList = (reviewedRecords ?? []) as {
    employer_id: string;
    tenure_months: number | null;
  }[];

  const reviewerEmployers = new Set(
    reviewerList
      .filter((r) => (r.tenure_months ?? 0) >= MIN_OVERLAP_MONTHS)
      .map((r) => r.employer_id)
  );
  const reviewedEmployers = new Set(
    reviewedList
      .filter((r) => (r.tenure_months ?? 0) >= MIN_OVERLAP_MONTHS)
      .map((r) => r.employer_id)
  );
  let hasOverlap = false;
  for (const eid of reviewerEmployers) {
    if (reviewedEmployers.has(eid)) {
      hasOverlap = true;
      break;
    }
  }

  if (!hasOverlap) {
    logIntel({
      tag: LOG_TAGS.FRAUD_BLOCK,
      context: "sandbox_peer_review_no_overlap",
      sandboxId: sandbox_id,
      reviewerId: reviewer_id,
      reviewedId: reviewed_id,
    });
    try {
      await insertHealthEvent({
        event_type: "overlap_failure",
        payload: {
          context: "sandbox_peer_review_no_overlap",
          sandboxId: sandbox_id,
          reviewerId: reviewer_id,
          reviewedId: reviewed_id,
        },
      });
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      status: 400,
      error: `Overlap of at least ${MIN_OVERLAP_MONTHS} month(s) at same employer required`,
    };
  }

  const { data: employerRow } = await supabase
    .from("sandbox_employers")
    .select("id, sandbox_id")
    .eq("sandbox_id", sandbox_id)
    .limit(1)
    .maybeSingle();
  if (!employerRow?.id) {
    return {
      ok: false,
      status: 400,
      error: "Employer not found or sandbox_id mismatch",
    };
  }

  const sentiment_score = calculateSentimentFromText(review_text);

  const { data, error } = await supabase
    .from("sandbox_peer_reviews")
    .insert({
      sandbox_id,
      reviewer_id,
      reviewed_id,
      rating,
      review_text,
      sentiment_score,
    })
    .select("id, rating, sentiment_score")
    .single();

  if (error) {
    return { ok: false, status: 400, error: error.message };
  }

  await runSandboxIntelligence(sandbox_id);
  await calculateSandboxMetrics(sandbox_id);

  return {
    ok: true,
    review: {
      id: data.id,
      rating: data.rating,
      sentiment_score: data.sentiment_score ?? null,
    },
  };
}
