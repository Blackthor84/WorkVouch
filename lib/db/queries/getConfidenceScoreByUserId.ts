import { admin } from "@/lib/supabase-admin";

const adminAny = admin as any;

/**
 * Get confidence score for a user from user_confidence_scores view.
 * Returns null if view missing or no row.
 */
export async function getConfidenceScoreByUserId(
  userId: string
): Promise<number | null> {
  try {
    const { data, error } = await adminAny
      .from("user_confidence_scores")
      .select("confidence_score")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return null;
    const row = data as { confidence_score?: number } | null;
    return row?.confidence_score ?? null;
  } catch {
    return null;
  }
}
