/**
 * Dashboard situational awareness: counts for flagged users, disputes, recent admin actions.
 * Server-side only; never throws. Used by admin dashboard.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getRecentAdminActions } from "./recentAdminActivity";

export type DashboardCounts = {
  flaggedUsers: number;
  openDisputes: number;
  recentActionCount: number;
};

/**
 * Fetch counts for admin dashboard widgets. Never throws.
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  try {
    const supabase = getSupabaseServer();
    const [flaggedRes, disputesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("flagged_for_fraud", true),
      supabase
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "under_review"]),
    ]);
    const flaggedUsers = typeof flaggedRes.count === "number" ? flaggedRes.count : 0;
    const openDisputes = typeof disputesRes.count === "number" ? disputesRes.count : 0;
    const recent = await getRecentAdminActions(10);
    return {
      flaggedUsers,
      openDisputes,
      recentActionCount: recent.length,
    };
  } catch {
    return { flaggedUsers: 0, openDisputes: 0, recentActionCount: 0 };
  }
}
