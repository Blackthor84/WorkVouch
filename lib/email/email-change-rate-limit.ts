/**
 * Rate limit: max 3 email change requests per user per 24 hours.
 * Uses email_change_requests table (count pending + completed in last 24h).
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

const MAX_REQUESTS_PER_24H = 3;
const WINDOW_HOURS = 24;

export async function checkEmailChangeRateLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
  const supabase = getServiceRoleClient();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { count, error } = await (supabase as any)
    .from("email_change_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("[SECURITY][EMAIL_CHANGE_RATE_LIMIT] check failed:", error);
    return { allowed: true, count: 0 }; // fail open for availability; log
  }
  const n = typeof count === "number" ? count : 0;
  return { allowed: n < MAX_REQUESTS_PER_24H, count: n };
}
