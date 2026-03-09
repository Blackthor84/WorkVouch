import { admin } from "@/lib/supabase-admin";
import type { JobVerificationRow } from "@/lib/db/types";

/**
 * Get all job_verifications rows; filter by jobIds in memory if needed.
 * Returns list of { job_id }. Caller can aggregate counts per job.
 */
export async function getJobVerificationsByJobIds(
  jobIds: string[]
): Promise<JobVerificationRow[]> {
  if (jobIds.length === 0) return [];

  const { data, error } = await admin
    .from("job_verifications")
    .select("job_id")
    .in("job_id", jobIds)
    .returns<JobVerificationRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}
