/**
 * Anomaly alert engine: log to anomaly_alerts when conditions are detected.
 * Call from review creation, employment creation, or background jobs.
 * Conditions (Phase 11): >10 reviews in 5 min, sentiment shift >40% in 24h,
 * same employer rapid negative spike, 3 failed overlap checks in 1 hour.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export type AnomalyAlertType =
  | "rapid_reviews"
  | "sentiment_shift"
  | "employer_negative_spike"
  | "overlap_failures";

export async function insertAnomalyAlert(params: {
  userId: string | null;
  alertType: AnomalyAlertType;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from("anomaly_alerts").insert({
    user_id: params.userId,
    alert_type: params.alertType,
    metadata: params.metadata ?? null,
  });
}
