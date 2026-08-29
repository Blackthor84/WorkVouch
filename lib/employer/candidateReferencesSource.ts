import { admin } from "@/lib/supabase-admin";
import { isMissingTableError } from "@/lib/supabase/postgrestErrors";

export type CandidateReferenceRating = {
  rating: number;
};

/**
 * Production-safe reference ratings for employer candidate panels.
 * Tries employment_references first, then user_references when absent.
 */
export async function loadCandidateReferenceRatings(
  candidateId: string
): Promise<CandidateReferenceRating[]> {
  const employmentRefs = await admin
    .from("employment_references")
    .select("rating")
    .eq("reviewed_user_id", candidateId);

  if (!employmentRefs.error) {
    return (employmentRefs.data ?? []) as CandidateReferenceRating[];
  }

  if (!isMissingTableError(employmentRefs.error)) {
    throw new Error(employmentRefs.error.message ?? "Failed to load employment references");
  }

  const userRefs = await admin
    .from("user_references")
    .select("rating")
    .eq("to_user_id", candidateId)
    .eq("is_deleted", false);

  if (!userRefs.error) {
    return (userRefs.data ?? []) as CandidateReferenceRating[];
  }

  if (isMissingTableError(userRefs.error)) {
    return [];
  }

  throw new Error(userRefs.error.message ?? "Failed to load user references");
}
