import { admin } from "@/lib/supabase-admin";
import type { TrustEventRow } from "@/lib/db/types";

/**
 * Get trust_events for a profile (for trust score and profile API).
 */
export async function getTrustEventsByProfileId(
  profileId: string,
  eventTypes?: string[]
): Promise<TrustEventRow[]> {
  let query = admin
    .from("trust_events")
    .select("event_type")
    .eq("profile_id", profileId);

  if (eventTypes?.length) {
    query = query.in("event_type", eventTypes);
  }

  const { data, error } = await query.returns<TrustEventRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}
