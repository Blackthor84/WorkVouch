import type { CredentialReferenceCredibility } from "./types";
import { getReferenceCredibilityBadges } from "@/lib/employer/referenceCredibilityBadges";

type RefRow = { id: string; from_user_id: string; job_id: string; relationship_type?: string | null };

/**
 * Compute reference credibility summary (counts only) for a candidate.
 * Used when building credential payload.
 * @param admin - Supabase admin/client (getSupabaseServer())
 */
export async function getReferenceCredibilitySummary(
  admin: unknown,
  candidateId: string
): Promise<CredentialReferenceCredibility> {
  const client = admin as {
    from(t: string): { select(s: string): { eq(c: string, v: string | boolean): Promise<{ data: (RefRow & { is_deleted?: boolean })[] | null }> } };
  };
  const { data: refsData } = await client
    .from("user_references")
    .select("id, from_user_id, job_id, relationship_type, is_deleted")
    .eq("to_user_id", candidateId);

  const all = (refsData ?? []).filter((x) => x && x.id) as (RefRow & { is_deleted?: boolean })[];
  const refsFiltered = all.filter((x) => !x.is_deleted) as RefRow[];

  if (refsFiltered.length === 0) {
    return {
      referenceCount: 0,
      directManagerCount: 0,
      repeatedCoworkerCount: 0,
      verifiedMatchCount: 0,
    };
  }

  const badges = await getReferenceCredibilityBadges(
    admin as Parameters<typeof getReferenceCredibilityBadges>[0],
    candidateId,
    refsFiltered.map((r) => ({ id: r.id, from_user_id: r.from_user_id, job_id: r.job_id, relationship_type: r.relationship_type ?? undefined }))
  );

  let directManagerCount = 0;
  let repeatedCoworkerCount = 0;
  let verifiedMatchCount = 0;
  for (const ref of refsFiltered) {
    const b = badges[ref.id];
    if (b?.is_direct_manager) directManagerCount++;
    if (b?.is_repeated_coworker) repeatedCoworkerCount++;
    if (b?.is_verified_match) verifiedMatchCount++;
  }

  return {
    referenceCount: refsFiltered.length,
    directManagerCount,
    repeatedCoworkerCount,
    verifiedMatchCount,
  };
}
