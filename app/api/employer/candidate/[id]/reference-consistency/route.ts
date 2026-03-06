/**
 * GET /api/employer/candidate/[id]/reference-consistency
 * Employer-only. Returns reference consistency summary for the candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ReferenceConsistencyResponse = {
  status: "consistent" | "review_recommended" | "no_references";
  referenceCount: number;
  averageRating: number;
  summary: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: refs, error } = await supabase
      .from("employment_references")
      .select("rating")
      .eq("reviewed_user_id", candidateId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const list = (refs ?? []) as { rating: number }[];
    const referenceCount = list.length;
    const averageRating =
      referenceCount > 0 ? list.reduce((s, r) => s + (r.rating ?? 0), 0) / referenceCount : 0;

    let status: ReferenceConsistencyResponse["status"] = "no_references";
    let summary: string;
    if (referenceCount === 0) {
      summary = "No references on file.";
    } else if (averageRating >= 4 && referenceCount >= 2) {
      status = "consistent";
      summary = "References align with strong ratings.";
    } else if (averageRating < 2.5 || referenceCount === 1) {
      status = "review_recommended";
      summary = "Consider additional references or review.";
    } else {
      status = "consistent";
      summary = "Multiple references with moderate ratings.";
    }

    return NextResponse.json({
      status,
      referenceCount,
      averageRating: Math.round(averageRating * 10) / 10,
      summary,
    } satisfies ReferenceConsistencyResponse);
  } catch (e) {
    console.error("[employer/candidate/reference-consistency]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
