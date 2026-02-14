/**
 * Recent admin activity and high-risk actions from admin_audit_logs. Server-side only; never throws.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const HIGH_RISK_ACTIONS = [
  "role_change",
  "hard_delete",
  "disable",
  "force_email_change",
  "profile_update",
];

export type RecentAdminAction = {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_id: string | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Fetch recent admin_audit_logs entries. Never throws. Uses enterprise schema columns.
 */
export async function getRecentAdminActions(limit = 20): Promise<RecentAdminAction[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("id, admin_user_id, action_type, target_id, after_state, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as RecentAdminAction[];
  } catch {
    return [];
  }
}

/**
 * Fetch high-risk actions (role changes, deletions, impersonation). Never throws.
 */
export async function getHighRiskActions(limit = 15): Promise<RecentAdminAction[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("id, admin_user_id, action_type, target_id, after_state, created_at")
      .in("action_type", HIGH_RISK_ACTIONS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as RecentAdminAction[];
  } catch {
    return [];
  }
}

const RAPID_ROLE_CHANGES_THRESHOLD = 5;
const RAPID_ROLE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AFTER_HOURS_START = 22; // 22:00
const AFTER_HOURS_END = 6; // 06:00

/**
 * Run admin anomaly checks (rapid role changes, after-hours) and record to in-memory store. Never throws.
 */
export async function runAdminAnomalyChecks(): Promise<void> {
  try {
    const { recordAdminAnomaly } = await import("@/lib/admin/adminAlertsStore");
    const supabase = getSupabaseServer();
    const since = new Date(Date.now() - RAPID_ROLE_WINDOW_MS).toISOString();
    const { data: roleChanges, error } = await supabase
      .from("admin_audit_logs")
      .select("admin_user_id, created_at")
      .eq("action_type", "role_change")
      .gte("created_at", since);
    if (!error && Array.isArray(roleChanges)) {
      const byAdmin: Record<string, number> = {};
      for (const r of roleChanges) {
        const id = (r as { admin_user_id?: string }).admin_user_id ?? "";
        byAdmin[id] = (byAdmin[id] ?? 0) + 1;
      }
      for (const [adminId, count] of Object.entries(byAdmin)) {
        if (count >= RAPID_ROLE_CHANGES_THRESHOLD) {
          recordAdminAnomaly("rapid_role_changes", { admin_id: adminId, count });
        }
      }
    }
    const { data: recent } = await supabase
      .from("admin_audit_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (Array.isArray(recent)) {
      const now = new Date();
      const hour = now.getHours();
      const isAfterHours = hour >= AFTER_HOURS_START || hour < AFTER_HOURS_END;
      if (isAfterHours) {
        for (const r of recent.slice(0, 5)) {
          const created = (r as { created_at?: string }).created_at;
          if (created) {
            const h = new Date(created).getHours();
            if (h >= AFTER_HOURS_START || h < AFTER_HOURS_END) {
              recordAdminAnomaly("after_hours_action", { at: created });
              break;
            }
          }
        }
      }
    }
  } catch {
    // no-op
  }
}
