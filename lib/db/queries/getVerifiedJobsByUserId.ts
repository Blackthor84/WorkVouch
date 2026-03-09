import { admin } from "@/lib/supabase-admin";
import type { JobRow } from "@/lib/db/types";

const adminAny = admin as any;

/**
 * Get verified, non-private jobs for a user (for candidate profile and similar).
 */
export async function getVerifiedJobsByUserId(userId: string): Promise<JobRow[]> {
  const { data, error } = await adminAny
    .from("jobs")
    .select("id, company_name, job_title, start_date, end_date, is_current, location")
    .eq("user_id", userId)
    .eq("verification_status", "verified")
    .eq("is_private", false)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as JobRow[];
}
