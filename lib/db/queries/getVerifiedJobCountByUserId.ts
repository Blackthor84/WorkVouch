import { admin } from "@/lib/supabase-admin";

/**
 * Get count of verified, non-private jobs for a user (for candidate preview).
 */
export async function getVerifiedJobCountByUserId(userId: string): Promise<number> {
  const { count, error } = await admin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("verification_status", "verified")
    .eq("is_private", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
