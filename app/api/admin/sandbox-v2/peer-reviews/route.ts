import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { calculateSentimentFromText, runSandboxIntelligence } from "@/lib/sandbox/enterpriseEngine";
import { calculateSandboxMetrics } from "@/lib/sandbox/metricsAggregator";

export const dynamic = "force-dynamic";

/**
 * Expected request body (no Zod; validated manually):
 * - sandbox_id or sandboxId: string (required, UUID)
 * - reviewer_id or reviewerId: string (required, UUID)
 * - reviewed_id or reviewedId: string (required, UUID)
 * - rating?: number 1-5 or string (optional, default 3)
 * - review_text or reviewText?: string | null (optional)
 * Do not send empty strings for required IDs; 400 if any required is missing.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    const body = await req.json().catch(() => ({}));
    console.log("PEER REVIEW RECEIVED BODY (before validation):", JSON.stringify(body, null, 2));
    const sandbox_id = (body.sandbox_id ?? body.sandboxId) as string | undefined;
    const reviewer_id = (body.reviewer_id ?? body.reviewerId) as string | undefined;
    const reviewed_id = (body.reviewed_id ?? body.reviewedId) as string | undefined;
    const rating = typeof body.rating === "number" ? Math.max(1, Math.min(5, body.rating)) : typeof body.rating === "string" ? Math.max(1, Math.min(5, parseInt(body.rating, 10) || 3)) : 3;
    const review_text = (body.review_text ?? body.reviewText) as string | undefined;

    if (!sandbox_id || !reviewer_id || !reviewed_id) {
      const missing = [
        !sandbox_id && "sandbox_id",
        !reviewer_id && "reviewer_id",
        !reviewed_id && "reviewed_id",
      ].filter(Boolean);
      console.log("PEER REVIEW BODY:", body);
      console.log("ERROR: Missing required fields", missing);
      return NextResponse.json({ error: "Missing sandbox_id, reviewer_id, or reviewed_id", missing }, { status: 400 });
    }

    const sentiment_score = calculateSentimentFromText(review_text ?? null);

    const { data, error } = await getSupabaseServer()
      .from("sandbox_peer_reviews")
      .insert({ sandbox_id, reviewer_id, reviewed_id, rating, review_text: review_text ?? null, sentiment_score })
      .select("id, rating, sentiment_score")
      .single();
    if (error) {
      console.log("PEER REVIEW BODY:", body);
      console.log("ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await runSandboxIntelligence(sandbox_id);
    await calculateSandboxMetrics(sandbox_id);
    return NextResponse.json({ success: true, review: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    console.log("ERROR:", e);
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
