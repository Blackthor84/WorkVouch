import {
  getProfileByPublicSlug,
  getConfidenceScoreByUserId,
  getVerifiedJobCountByUserId,
} from "@/lib/db/queries";
import type { CandidatePreviewDTO } from "@/lib/services/types";

/**
 * Get candidate preview for public paywall (name, score, job count only).
 * Returns null if profile not found.
 */
export async function getCandidatePreview(
  slug: string
): Promise<CandidatePreviewDTO | null> {
  const profile = await getProfileByPublicSlug(slug);
  if (!profile) return null;

  const [confidenceScore, jobCount] = await Promise.all([
    getConfidenceScoreByUserId(profile.id),
    getVerifiedJobCountByUserId(profile.id),
  ]);

  return {
    profile,
    confidenceScore,
    jobCount,
  };
}
