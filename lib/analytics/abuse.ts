/**
 * Abuse detection for internal analytics.
 * Writes to abuse_signals. No PII. Sandbox-isolated.
 * Does not block capture; best-effort. Fail closed for main capture only.
 * On new signal, creates an admin alert (best-effort, fire-and-forget).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAlertFromAbuseSignal } from "@/lib/admin/alerts";

const RAPID_PV_THRESHOLD = 25;
const RAPID_WINDOW_MS = 60 * 1000;

export type AbuseSignalType =
  | "rapid_refresh"
  | "scraping"
  | "multi_account_same_ip"
  | "vpn_abuse"
  | "geo_switch"
  | "failed_login_loop"
  | "sandbox_misuse";

/**
 * Check if session has too many page views in last minute; if so, record abuse signal.
 * Call after inserting a page view. Does not throw.
 */
export async function maybeRecordRapidRefresh(
  supabase: SupabaseClient,
  session_id: string | null,
  is_sandbox: boolean
): Promise<void> {
  if (!session_id) return;
  try {
    const since = new Date(Date.now() - RAPID_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("site_page_views")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session_id)
      .gte("created_at", since);
    if ((count ?? 0) >= RAPID_PV_THRESHOLD) {
      const { data: inserted } = await supabase
        .from("abuse_signals")
        .insert({
          session_id,
          signal_type: "rapid_refresh",
          severity: 2,
          metadata: { count: count ?? 0, window_sec: RAPID_WINDOW_MS / 1000 },
          is_sandbox,
        })
        .select("id")
        .single();
      const abuseSignalId = (inserted as { id?: string } | null)?.id;
      createAlertFromAbuseSignal({
        session_id,
        signal_type: "rapid_refresh",
        severity: 2,
        is_sandbox,
        metadata: { count: count ?? 0, window_sec: RAPID_WINDOW_MS / 1000 },
        abuse_signal_id: abuseSignalId ?? undefined,
      }).catch(() => {});
    }
  } catch {
    // best-effort
  }
}
