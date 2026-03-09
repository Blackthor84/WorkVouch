/**
 * Simple trust score utility for recruiter API and resume export.
 * Formula: base 50 + 5 per coworker verification + 10 per manager verification + 2 per network connection; cap 100.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const BASE_SCORE = 50;
const COWORKER_POINTS = 5;
const MANAGER_POINTS = 10;
const NETWORK_POINT_PER_CONNECTION = 2;
const MAX_SCORE = 100;
const MIN_SCORE = 0;

/**
 * Calculate a 0–100 trust score for a profile from trust_events and trust_relationships.
 */
export async function calculateTrustScore(profileId: string): Promise<number> {
  const sb = getSupabaseServer();

  type EventRow = { event_type: string };
  type RelRow = { id: string };

  const [eventsRes, relRes] = await Promise.all([
    sb
      .from("trust_events")
      .select("event_type")
      .eq("profile_id", profileId)
      .returns<EventRow[]>(),
    sb
      .from("trust_relationships")
      .select("id")
      .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
      .returns<RelRow[]>(),
  ]);

  const events: EventRow[] = eventsRes.data ?? [];
  const coworkerCount = events.filter(
    (e) =>
      e.event_type === "coworker_verified" ||
      e.event_type === "coworker_verification_confirmed"
  ).length;
  const managerCount = events.filter(
    (e) =>
      e.event_type === "manager_verified" ||
      e.event_type === "employment_verified" ||
      e.event_type === "verification_confirmed"
  ).length;

  const connections: RelRow[] = relRes.data ?? [];
  const networkCount = connections.length;

  let score =
    BASE_SCORE +
    coworkerCount * COWORKER_POINTS +
    managerCount * MANAGER_POINTS +
    networkCount * NETWORK_POINT_PER_CONNECTION;

  score = Math.round(Math.max(MIN_SCORE, Math.min(MAX_SCORE, score)));
  return score;
}
