import { getSupabaseServer } from "@/lib/supabase/admin";

/** Gather metrics for a user (profile + approved verifications via jobs, etc.). */
export async function gatherUserMetrics(userId: string) {
  const supabase = getSupabaseServer() as any;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const profileAny = profile as Record<string, unknown> | null;
  const trustScore = (profileAny?.trust_score as number) ?? 0;
  const peerScore = (profileAny?.peer_score as number) ?? 0;
  const consistencyScore = (profileAny?.consistency_score as number) ?? 0;
  const disputeCount = (profileAny?.dispute_count as number) | 0;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("user_id", userId);

  const jobIds = (jobs as { id: string }[] | null)?.map((j) => j.id) ?? [];
  let verifications = 0;
  if (jobIds.length > 0) {
    const { count } = await supabase
      .from("verification_requests")
      .select("*", { count: "exact", head: true })
      .in("job_id", jobIds)
      .eq("status", "approved");
    verifications = count ?? 0;
  }

  return {
    verified_jobs: verifications,
    trust_score: trustScore,
    peer_score: peerScore,
    consistency_score: consistencyScore,
    dispute_penalty: disputeCount ? disputeCount * -5 : 0,
  };
}
