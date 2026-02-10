/**
 * Anomaly alert engine: run checks after review/employment events.
 * Conditions: >10 reviews in 5 min, sentiment shift, overlap failures, employer negative spike.
 * Calls insertAnomalyAlert and optionally fraud_signals when conditions are met.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { insertAnomalyAlert } from "./anomalyAlerts";

const RAPID_REVIEWS_THRESHOLD = 10;
const RAPID_REVIEWS_WINDOW_MS = 5 * 60 * 1000;

/**
 * Run anomaly checks for a user after a review was created (reviewed_user_id).
 * - Rapid velocity: >10 reviews in 5 min for this user → alert.
 */
export async function runAnomalyChecksAfterReview(reviewedUserId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const windowStart = new Date(Date.now() - RAPID_REVIEWS_WINDOW_MS).toISOString();
    const { data: recent } = await supabase
      .from("employment_references")
      .select("id")
      .eq("reviewed_user_id", reviewedUserId)
      .gte("created_at", windowStart);
    const count = Array.isArray(recent) ? recent.length : 0;
    if (count >= RAPID_REVIEWS_THRESHOLD) {
      await insertAnomalyAlert({
        userId: reviewedUserId,
        alertType: "rapid_reviews",
        metadata: { count, windowMinutes: 5 },
      });
      const sb = getServiceRoleClient();
      await sb.from("fraud_signals").insert({
        user_id: reviewedUserId,
        signal_type: "rapid_velocity",
        metadata: { count, windowMinutes: 5 },
      });
    }
  } catch {
    // Non-fatal; do not throw
  }
}

/**
 * Run anomaly checks after an overlap/validation failure (e.g. from employment or match flow).
 */
export async function runAnomalyChecksOverlapFailure(userId: string | null): Promise<void> {
  try {
    if (!userId) return;
    const supabase = getSupabaseServer();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: events } = await supabase
      .from("intelligence_health_events")
      .select("id")
      .eq("event_type", "overlap_failure")
      .gte("created_at", oneHourAgo);
    const count = Array.isArray(events) ? events.length : 0;
    if (count >= 3) {
      await insertAnomalyAlert({
        userId,
        alertType: "overlap_failures",
        metadata: { failureCount: count, windowMinutes: 60 },
      });
    }
  } catch {
    // Non-fatal
  }
}
