/**
 * Build canonical ProfileInput from production DB for the v1 intelligence engine.
 * No scoring logic — only data loading and shaping. See docs/workvouch-intelligence-v1.md.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { ProfileInput } from "../types";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Build ProfileInput for a user from production employment_records, employment_references,
 * review_intelligence, and rehire_registry. Used by trust score and intelligence snapshot.
 */
export async function buildProductionProfileInput(
  userId: string
): Promise<ProfileInput> {
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
  const now = new Date();
  let totalMonths = 0;
  for (const r of verifiedList) {
    const start = new Date(r.start_date);
    const end = r.end_date ? new Date(r.end_date) : now;
    const years = (end.getTime() - start.getTime()) / MS_PER_YEAR;
    totalMonths += years * 12;
  }

  const { data: refs } = await sb
    .from("employment_references")
    .select("id, rating")
    .eq("reviewed_user_id", userId);
  const refList = (refs ?? []) as { id: string; rating: number }[];
  const reviewCount = refList.length;
  const averageRating =
    reviewCount > 0
      ? refList.reduce((s, r) => s + r.rating, 0) / reviewCount
      : 3;

  let sentimentAverage = 0;
  if (refList.length > 0) {
    const refIds = refList.map((r) => r.id);
    const { data: revIntel } = await sb
      .from("review_intelligence")
      .select("sentiment_score")
      .in("review_id", refIds);
    const intelList = (revIntel ?? []) as { sentiment_score?: number | null }[];
    if (intelList.length > 0) {
      const avg100 =
        intelList.reduce((s, r) => s + (r.sentiment_score ?? 50), 0) /
        intelList.length;
      sentimentAverage = Math.max(-1, Math.min(1, (avg100 / 100 - 0.5) * 2));
    }
  }

  const { data: rehireRows } = await sb
    .from("rehire_registry")
    .select("id")
    .eq("profile_id", userId)
    .limit(1);
  const rehireEligible = Array.isArray(rehireRows) && rehireRows.length > 0;

  return {
    totalMonths,
    reviewCount,
    sentimentAverage,
    averageRating: Math.max(1, Math.min(5, averageRating)),
    rehireEligible,
  };
}
