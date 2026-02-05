import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { calculateSentimentFromText } from "@/lib/sandbox/enterpriseEngine";

export const dynamic = "force-dynamic";
const sb = () => getSupabaseServer() as any;

export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const reviewer_id = (body.reviewer_id ?? body.reviewerId) as string | undefined;
    const reviewed_id = (body.reviewed_id ?? body.reviewedId) as string | undefined;
    const rating = typeof body.rating === "number" ? Math.max(1, Math.min(5, body.rating)) : typeof body.rating === "string" ? Math.max(1, Math.min(5, parseInt(body.rating, 10) || 3)) : 3;
    const review_text = (body.review_text ?? body.reviewText) as string | undefined;

    if (!sandbox_id || !reviewer_id || !reviewed_id) return NextResponse.json({ error: "Missing sandbox_id, reviewer_id, or reviewed_id" }, { status: 400 });

    const sentiment_score = calculateSentimentFromText(review_text ?? null);

    const { data, error } = await sb()
      .from("sandbox_peer_reviews")
      .insert({ sandbox_id, reviewer_id, reviewed_id, rating, review_text: review_text ?? null, sentiment_score })
      .select("id, rating, sentiment_score")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, review: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
