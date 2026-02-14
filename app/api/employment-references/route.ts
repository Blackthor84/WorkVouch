/**
 * POST /api/employment-references
 * Single path: core submitReview. Rate limited, Zod validated.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { submitReview } from "@/lib/core/reviews";
import { logAudit, type AuditEntity } from "@/lib/dispute-audit";
import { processReviewIntelligence } from "@/lib/intelligence/processReviewIntelligence";
import { runAnomalyChecksAfterReview } from "@/lib/admin/runAnomalyChecks";
import { withRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  employment_match_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rl = withRateLimit(req, {
      userId: session.user.id,
      ...RATE_LIMITS.employmentReferences,
      prefix: "rl:ref:",
    });
    if (!rl.allowed) return rl.response;

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await submitReview(
      {
        employment_match_id: parsed.data.employment_match_id,
        reviewer_id: session.user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
      {
        auditLog: (payload) =>
          logAudit({
            entityType: payload.entityType as AuditEntity,
            entityId: payload.entityId,
            changedBy: payload.changedBy,
            newValue: payload.newValue as Record<string, unknown> | null | undefined,
            changeReason: payload.changeReason,
          }),
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const intelResult = await processReviewIntelligence(result.referenceId);
    if (!intelResult.ok) {
      console.error("[employment-references] processReviewIntelligence failed:", intelResult.error);
      return NextResponse.json(
        {
          error: "Reference saved but intelligence processing failed",
          warning: "Score update may be delayed; retry later.",
          id: result.referenceId,
        },
        { status: 500 }
      );
    }

    await runAnomalyChecksAfterReview(result.reviewedUserId);

    return NextResponse.json({ id: result.referenceId, success: true });
  } catch (e) {
    console.error("[employment-references] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
