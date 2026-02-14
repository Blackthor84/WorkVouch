/**
 * Insert employment records from parsed resume. Coworker matching uses coworker_matches only
 * (employment_matches does not exist). Does not send emails.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { NormalizedEmployment } from "@/lib/resume/parseAndStore";

export type InsertFromResumeResult = {
  employmentRecordIds: string[];
  matchesCreated: number;
};

/**
 * Insert each job into employment_records (source: 'resume' when column exists).
 * Match creation is not performed (employment_matches does not exist).
 */
export async function insertEmploymentFromResume(
  userId: string,
  jobs: NormalizedEmployment[]
): Promise<InsertFromResumeResult> {
  const sb = getSupabaseServer();
  const employmentRecordIds: string[] = [];

  for (const job of jobs) {
    const rowWithSource: Record<string, unknown> = {
      user_id: userId,
      company_name: job.company_name,
      company_normalized: job.company_normalized,
      job_title: job.job_title,
      start_date: job.start_date,
      end_date: job.end_date,
      is_current: job.is_current ?? false,
      verification_status: "pending",
      source: "resume",
    };
    const { data: inserted, error } = await sb
      .from("employment_records")
      .insert(rowWithSource as never)
      .select("id")
      .single();

    let recordId: string | null = inserted ? (inserted as { id: string }).id : null;
    if (error && (error as { message?: string }).message?.includes("source")) {
      const { data: inserted2, error: err2 } = await sb
        .from("employment_records")
        .insert({
          user_id: userId,
          company_name: job.company_name,
          company_normalized: job.company_normalized,
          job_title: job.job_title,
          start_date: job.start_date,
          end_date: job.end_date,
          is_current: job.is_current ?? false,
          verification_status: "pending",
        })
        .select("id")
        .single();
      if (!err2 && inserted2) recordId = (inserted2 as { id: string }).id;
    } else if (inserted) {
      recordId = (inserted as { id: string }).id;
    }

    if (recordId) employmentRecordIds.push(recordId);
  }

  return { employmentRecordIds, matchesCreated: 0 };
}

