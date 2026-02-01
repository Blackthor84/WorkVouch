/**
 * POST /api/employment-references
 * Submit a reference for a confirmed employment match. Rate limited. Zod validated.
 * Only confirmed matches; unique (employment_match_id, reviewer_id). Recalculates trust score.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";
import { z } from "zod";

export const dynamic = "force-dynamic";

const REFERENCE_RATE_LIMIT = 10;
const REFERENCE_RATE_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const times = rateMap.get(userId) ?? [];
  const windowStart = now - REFERENCE_RATE_WINDOW_MS;
  const recent = times.filter((t) => t > windowStart);
  if (recent.length >= REFERENCE_RATE_LIMIT) return false;
  recent.push(now);
  rateMap.set(userId, recent);
  return true;
}

const bodySchema = z.object({
  employment_match_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many reference submissions. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const sb = getSupabaseServer() as any;
    const { employment_match_id, rating, comment } = parsed.data;

    const { data: match, error: matchErr } = await sb
      .from("employment_matches")
      .select("id, employment_record_id, matched_user_id, match_status")
      .eq("id", employment_match_id)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.match_status !== "confirmed") {
      return NextResponse.json(
        { error: "Only confirmed matches can receive references" },
        { status: 403 }
      );
    }

    const { data: rec } = await sb
      .from("employment_records")
      .select("user_id")
      .eq("id", match.employment_record_id)
      .single();

    const recordOwnerId = rec?.user_id;
    const matchedUserId = match.matched_user_id;
    const reviewerId = session.user.id;
    const reviewedUserId = recordOwnerId === reviewerId ? matchedUserId : recordOwnerId;

    if (reviewedUserId === reviewerId) {
      return NextResponse.json({ error: "Cannot reference yourself" }, { status: 400 });
    }

    const { data: existing } = await sb
      .from("employment_references")
      .select("id")
      .eq("employment_match_id", employment_match_id)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You have already left a reference for this match" }, { status: 409 });
    }

    const reliability_score = rating * 20;

    const { data: ref, error: insertErr } = await sb
      .from("employment_references")
      .insert({
        employment_match_id,
        reviewer_id: reviewerId,
        reviewed_user_id: reviewedUserId,
        rating,
        reliability_score,
        comment: comment ?? null,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[employment-references] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to save reference" }, { status: 500 });
    }

    await recalculateTrustScore(reviewedUserId);

    return NextResponse.json({ id: ref?.id, success: true });
  } catch (e) {
    console.error("[employment-references] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
