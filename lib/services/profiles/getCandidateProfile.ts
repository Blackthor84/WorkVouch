import {
  getProfileByPublicSlug,
  getConfidenceScoreByUserId,
  getVerifiedJobsByUserId,
  getJobVerificationsByJobIds,
} from "@/lib/db/queries";
import type { CandidateProfileDTO } from "@/lib/services/types";

/**
 * Get full candidate profile for employer view (verified jobs + coworker counts).
 * Returns null if profile not found.
 */
export async function getCandidateProfile(
  slug: string
): Promise<CandidateProfileDTO | null> {
  const profile = await getProfileByPublicSlug(slug);
  if (!profile) return null;

  const profileId = profile.id;

  const [confidenceScore, jobs] = await Promise.all([
    getConfidenceScoreByUserId(profileId),
    getVerifiedJobsByUserId(profileId),
  ]);

  const jobIds = jobs.map((j) => j.id);
  const verifications =
    jobIds.length > 0 ? await getJobVerificationsByJobIds(jobIds) : [];

  const jobIdsSet = new Set(jobIds);
  const confirmationsByJob: Record<string, number> = {};
  for (const v of verifications) {
    if (jobIdsSet.has(v.job_id)) {
      confirmationsByJob[v.job_id] = (confirmationsByJob[v.job_id] ?? 0) + 1;
    }
  }

  return {
    profile,
    confidenceScore,
    jobs,
    confirmationsByJob,
  };
}
