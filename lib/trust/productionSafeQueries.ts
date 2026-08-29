import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMissingColumnError,
  isMissingTableError,
} from "@/lib/supabase/postgrestErrors";

type QueryError = { code?: string; message?: string } | null;

export async function loadStoredTrustScore(
  supabase: SupabaseClient,
  candidateId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("trust_scores")
    .select("score")
    .eq("user_id", candidateId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) return 0;
    throw new Error(error.message ?? "Failed to load trust score");
  }

  return data?.score != null ? Number(data.score) : 0;
}

export async function candidateHasReferenceType(
  supabase: SupabaseClient,
  candidateId: string,
  dbType: string
): Promise<boolean> {
  const userRefs = await supabase
    .from("user_references")
    .select("id")
    .eq("to_user_id", candidateId)
    .eq("relationship_type", dbType)
    .eq("is_deleted", false)
    .limit(1);

  if (!userRefs.error) {
    return (userRefs.data?.length ?? 0) > 0;
  }

  if (!isMissingTableError(userRefs.error) && !isMissingColumnError(userRefs.error)) {
    throw new Error(userRefs.error.message ?? "Failed to load user references");
  }

  const employmentRefs = await supabase
    .from("employment_references")
    .select("id")
    .eq("reviewed_user_id", candidateId)
    .limit(1);

  if (!employmentRefs.error) {
    return (employmentRefs.data?.length ?? 0) > 0;
  }

  if (isMissingTableError(employmentRefs.error)) {
    return false;
  }

  throw new Error(employmentRefs.error.message ?? "Failed to load employment references");
}

export async function loadTrustRelationships(
  supabase: SupabaseClient,
  candidateId: string
): Promise<
  Array<{
    source_profile_id: string;
    target_profile_id: string;
    relationship_type: string;
  }>
> {
  const { data, error } = await supabase
    .from("trust_relationships")
    .select("source_profile_id, target_profile_id, relationship_type")
    .or(`source_profile_id.eq.${candidateId},target_profile_id.eq.${candidateId}`);

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) return [];
    throw new Error(error.message ?? "Failed to load trust relationships");
  }

  return (data ?? []) as Array<{
    source_profile_id: string;
    target_profile_id: string;
    relationship_type: string;
  }>;
}

export async function hasRecentTrustDispute(
  supabase: SupabaseClient,
  candidateId: string,
  sinceIso: string
): Promise<boolean> {
  const extended = await supabase
    .from("trust_events")
    .select("id")
    .eq("profile_id", candidateId)
    .eq("event_type", "dispute")
    .gte("created_at", sinceIso)
    .limit(1);

  if (!extended.error) {
    return (extended.data?.length ?? 0) > 0;
  }

  if (isMissingTableError(extended.error)) {
    return false;
  }

  if (isMissingColumnError(extended.error)) {
    const base = await supabase
      .from("trust_events")
      .select("id, event_type, payload, created_at")
      .eq("profile_id", candidateId)
      .gte("created_at", sinceIso)
      .limit(20);

    if (base.error) {
      if (isMissingTableError(base.error)) return false;
      throw new Error(base.error.message ?? "Failed to load trust events");
    }

    return (base.data ?? []).some((row) => {
      const eventType = String((row as { event_type?: string }).event_type ?? "").toLowerCase();
      if (eventType === "dispute") return true;
      const payload = (row as { payload?: Record<string, unknown> }).payload;
      return String(payload?.type ?? payload?.event_type ?? "").toLowerCase() === "dispute";
    });
  }

  throw new Error(extended.error.message ?? "Failed to load trust events");
}

export function isTrustPoliciesTableMissing(error: QueryError): boolean {
  return isMissingTableError(error);
}
