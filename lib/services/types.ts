/**
 * Service-layer DTOs and return types.
 * Used by services and pages; not raw DB row types.
 */

import type { ProfileRow, JobRow } from "@/lib/db/types";

/** Candidate profile as returned by getCandidateProfile (full employer view). */
export type CandidateProfileDTO = {
  profile: ProfileRow;
  confidenceScore: number | null;
  jobs: JobRow[];
  confirmationsByJob: Record<string, number>;
};

/** Candidate preview as returned by getCandidatePreview (public blurred view). */
export type CandidatePreviewDTO = {
  profile: ProfileRow;
  confidenceScore: number | null;
  jobCount: number;
};
