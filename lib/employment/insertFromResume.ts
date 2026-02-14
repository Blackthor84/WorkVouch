/**
 * Insert employment records from parsed resume and run coworker matching.
 * Same company_normalized + date overlap >= 30 days → employment_matches (pending).
 * No emails; user sees matches in-app only (App Store compliant).
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { NormalizedEmployment } from "@/lib/resume/parseAndStore";

const MIN_OVERLAP_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function overlapDays(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date | null
): number {
  const e1 = (end1 ?? new Date()).getTime();
  const e2 = (end2 ?? new Date()).getTime();
  const overlapStart = Math.max(start1.getTime(), start2.getTime());
  const overlapEnd = Math.min(e1, e2);
  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / MS_PER_DAY;
}

export type InsertFromResumeResult = {
  employmentRecordIds: string[];
  matchesCreated: number;
};

/**
 * Insert each job into employment_records (source: 'resume'), then for each
 * find other users with same company_normalized + overlapping dates and insert employment_matches.
 * Does not send emails.
 */
export async function insertEmploymentFromResume(
  userId: string,
  jobs: NormalizedEmployment[]
): Promise<InsertFromResumeResult> {
  const sb = getSupabaseServer();
  const employmentRecordIds: string[] = [];
  let matchesCreated = 0;

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

    if (!recordId) continue;
    employmentRecordIds.push(recordId);

    const { data: myRecord } = await sb
      .from("employment_records")
      .select("id, user_id, company_normalized, start_date, end_date")
      .eq("id", recordId as string)
      .single();
    if (!myRecord) continue;

    const myStart = new Date((myRecord as { start_date: string }).start_date);
    const myEnd = (myRecord as { end_date: string | null }).end_date
      ? new Date((myRecord as { end_date: string }).end_date)
      : null;

    const { data: others } = await sb
      .from("employment_records")
      .select("id, user_id, start_date, end_date")
      .eq("company_normalized", (myRecord as { company_normalized: string }).company_normalized)
      .neq("user_id", userId);

    for (const other of others ?? []) {
      const theirStart = new Date((other as { start_date: string }).start_date);
      const theirEnd = (other as { end_date: string | null }).end_date
        ? new Date((other as { end_date: string }).end_date)
        : null;
      const days = overlapDays(myStart, myEnd, theirStart, theirEnd);
      if (days < MIN_OVERLAP_DAYS) continue;

      const overlapStart = new Date(Math.max(myStart.getTime(), theirStart.getTime()));
      const overlapEnd = new Date(Math.min((myEnd ?? new Date()).getTime(), (theirEnd ?? new Date()).getTime()));

      const { data: existing } = await sb
        .from("employment_matches")
        .select("id")
        .eq("employment_record_id", recordId)
        .eq("matched_user_id", (other as { user_id: string }).user_id)
        .maybeSingle();
      if (existing) continue;

      const { error: matchErr } = await sb.from("employment_matches").insert({
        employment_record_id: recordId,
        matched_user_id: (other as { user_id: string }).user_id,
        overlap_start: overlapStart.toISOString().slice(0, 10),
        overlap_end: overlapEnd.toISOString().slice(0, 10),
        match_status: "pending",
      });
      if (!matchErr) matchesCreated++;
    }
  }

  return { employmentRecordIds, matchesCreated };
}

