import { admin } from "@/lib/supabase-admin";

type RelRow = { id: string } | { relationship_type: string };

/**
 * Get trust_relationships where profile is source or target (for trust score / network depth).
 */
export async function getTrustRelationshipsByProfileId(
  profileId: string,
  columns: "id" | "relationship_type" = "id"
): Promise<RelRow[]> {
  const { data, error } = await admin
    .from("trust_relationships")
    .select(columns)
    .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
    .returns<RelRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}
