import { admin } from "@/lib/supabase-admin";
import type { EmploymentRecordRow } from "@/lib/db/types";

/**
 * Get employment records for resume/PDF export (verified or matched).
 */
export async function getEmploymentRecordsForExport(
  userId: string
): Promise<EmploymentRecordRow[]> {
  const { data, error } = await admin
    .from("employment_records")
    .select("company_name, job_title, start_date, end_date, verification_status")
    .eq("user_id", userId)
    .in("verification_status", ["verified", "matched"])
    .returns<EmploymentRecordRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}
