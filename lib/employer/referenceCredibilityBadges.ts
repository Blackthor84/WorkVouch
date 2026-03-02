/**
 * Reference credibility badges: computed from existing employment and reference data.
 * Used only for display; no identities or sensitive metadata are exposed.
 */

export interface ReferenceCredibilityBadges {
  is_direct_manager: boolean;
  is_repeated_coworker: boolean;
  is_verified_match: boolean;
}

interface RefInput {
  id: string;
  from_user_id: string;
  job_id: string;
  relationship_type?: string;
}

/** Minimal Supabase-like client for badge queries (jobs by id). */
interface SupabaseClientForBadges {
  from(table: string): {
    select(columns: string): { in(column: string, values: string[]): Promise<{ data: unknown }> };
  };
}

/**
 * Compute credibility badges for each reference.
 * - is_direct_manager: referrer is the candidate's supervisor for this role (relationship_type === 'supervisor').
 * - is_repeated_coworker: same referrer has given more than one reference for this candidate.
 * - is_verified_match: the job tied to this reference has verification_status === 'verified'.
 */
export async function getReferenceCredibilityBadges(
  supabase: SupabaseClientForBadges,
  _candidateId: string,
  references: RefInput[]
): Promise<Record<string, ReferenceCredibilityBadges>> {
  const result: Record<string, ReferenceCredibilityBadges> = {};
  if (!references?.length) return result;

  // Count references per from_user_id (for this candidate's refs) to detect repeated coworker
  const fromUserCounts = new Map<string, number>();
  for (const ref of references) {
    const uid = ref.from_user_id ?? "";
    fromUserCounts.set(uid, (fromUserCounts.get(uid) ?? 0) + 1);
  }

  // Job verification: fetch verification_status for all job_ids
  const jobIds = [...new Set(references.map((r) => r.job_id).filter(Boolean))];
  const jobVerified = new Set<string>();
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, verification_status")
      .in("id", jobIds);
    const list = (jobs ?? []) as { id: string; verification_status?: string }[];
    for (const j of list) {
      if (j.verification_status === "verified") jobVerified.add(j.id);
    }
  }

  for (const ref of references) {
    const fromCount = fromUserCounts.get(ref.from_user_id ?? "") ?? 0;
    result[ref.id] = {
      is_direct_manager: ref.relationship_type === "supervisor",
      is_repeated_coworker: fromCount >= 2,
      is_verified_match: ref.job_id ? jobVerified.has(ref.job_id) : false,
    };
  }
  return result;
}
