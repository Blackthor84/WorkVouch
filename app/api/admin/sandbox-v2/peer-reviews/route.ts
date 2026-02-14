import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import {
  calculateSentimentFromText,
  runSandboxIntelligence,
} from "@/lib/sandbox/enterpriseEngine";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";
import { logIntel, LOG_TAGS, insertHealthEvent } from "@/lib/core/intelligence";

export const dynamic = "force-dynamic";

const MIN_OVERLAP_MONTHS = 1;

/**
 * Sandbox peer-review API. Matches production fraud rules:
 * - Block self-review
 * - Block duplicate review per (sandbox_id, reviewer_id, reviewed_id)
 * - Validate employee exists (reviewer + reviewed in sandbox_employees, sandbox_id)
 * - Validate overlap >= 30 days (both have employment at same employer with tenure_months >= 1)
 * - Validate sandbox_id matches for all related entities
 */
export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const reviewer_id = (body.reviewer_id ?? body.reviewerId) as
      | string
      | undefined;
    const reviewed_id = (body.reviewed_id ?? body.reviewedId) as
      | string
      | undefined;
    const rating =
      typeof body.rating === "number"
        ? Math.max(1, Math.min(5, body.rating))
        : typeof body.rating === "string"
          ? Math.max(1, Math.min(5, parseInt(body.rating, 10) || 3))
          : 3;
    const review_text = (body.review_text ?? body.reviewText) as
      | string
      | undefined;

    if (!sandbox_id || !reviewer_id || !reviewed_id) {
      const missing = [
        !sandbox_id && "sandbox_id",
        !reviewer_id && "reviewer_id",
        !reviewed_id && "reviewed_id",
      ].filter(Boolean);
      return NextResponse.json(
        { error: "Missing sandbox_id, reviewer_id, or reviewed_id", missing },
        { status: 400 }
      );
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
      } catch (err: unknown) {
        console.error("[API][sandbox-v2/peer-reviews] insertHealthEvent fraud_block", { err });
      }
      return NextResponse.json(
        { error: "Self-review is not allowed" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "One review per coworker per overlap; duplicate not allowed" },
        { status: 409 }
      );
    }

    const { data: reviewerEmp } = await supabase
      .from("sandbox_employees")
      .select("id, sandbox_id")
      .eq("id", reviewer_id)
      .eq("sandbox_id", sandbox_id)
      .maybeSingle();
    if (!reviewerEmp?.id) {
      return NextResponse.json(
        { error: "Reviewer employee not found or sandbox_id mismatch" },
        { status: 400 }
      );
    }

    const { data: reviewedEmp } = await supabase
      .from("sandbox_employees")
      .select("id, sandbox_id")
      .eq("id", reviewed_id)
      .eq("sandbox_id", sandbox_id)
      .maybeSingle();
    if (!reviewedEmp?.id) {
      return NextResponse.json(
        { error: "Reviewed employee not found or sandbox_id mismatch" },
        { status: 400 }
      );
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
      } catch (err: unknown) {
        console.error("[API][sandbox-v2/peer-reviews] insertHealthEvent overlap_failure", { err });
      }
      return NextResponse.json(
        {
          error: `Overlap of at least ${MIN_OVERLAP_MONTHS} month(s) at same employer required`,
        },
        { status: 400 }
      );
    }

    const { data: employerRow } = await supabase
      .from("sandbox_employers")
      .select("id, sandbox_id")
      .eq("sandbox_id", sandbox_id)
      .limit(1)
      .maybeSingle();
    if (!employerRow?.id) {
      return NextResponse.json(
        { error: "Employer not found or sandbox_id mismatch" },
        { status: 400 }
      );
    }

    const sentiment_score = calculateSentimentFromText(review_text ?? null);

    const { data, error } = await supabase
      .from("sandbox_peer_reviews")
      .insert({
        sandbox_id,
        reviewer_id,
        reviewed_id,
        rating,
        review_text: review_text ?? null,
        sentiment_score,
      })
      .select("id, rating, sentiment_score")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    await runSandboxIntelligence(sandbox_id);
    await calculateSandboxMetrics(sandbox_id);
    return NextResponse.json({ success: true, review: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized")
      return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
