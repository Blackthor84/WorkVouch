/**
 * Dashboard situational awareness: counts for flagged users, disputes, recent admin actions,
 * and basic metrics (users, employers, employees, recent signups).
 * Server-side only; never throws. Used by admin dashboard.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getRecentAdminActions } from "./recentAdminActivity";

export type DashboardCounts = {
  flaggedUsers: number;
  openDisputes: number;
  recentActionCount: number;
  totalUsers: number;
  totalEmployers: number;
  totalEmployees: number;
  recentSignups: number;
};

/**
 * Fetch counts for admin dashboard widgets. Never throws.
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  try {
    const supabase = getSupabaseServer();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    const [
      flaggedRes,
      disputesRes,
      profilesCountRes,
      employersCountRes,
      recentSignupsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("flagged_for_fraud", true),
      supabase
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "under_review"]),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("employer_accounts").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgoIso),
    ]);

    const flaggedUsers = typeof flaggedRes.count === "number" ? flaggedRes.count : 0;
    const openDisputes = typeof disputesRes.count === "number" ? disputesRes.count : 0;
    const totalUsers = typeof profilesCountRes.count === "number" ? profilesCountRes.count : 0;
    const totalEmployers = typeof employersCountRes.count === "number" ? employersCountRes.count : 0;
    const recentSignups = typeof recentSignupsRes.count === "number" ? recentSignupsRes.count : 0;
    const totalEmployees = Math.max(0, totalUsers - totalEmployers);

    const recent = await getRecentAdminActions(10);
    return {
      flaggedUsers,
      openDisputes,
      recentActionCount: recent.length,
      totalUsers,
      totalEmployers,
      totalEmployees,
      recentSignups,
    };
  } catch {
    return {
      flaggedUsers: 0,
      openDisputes: 0,
      recentActionCount: 0,
      totalUsers: 0,
      totalEmployers: 0,
      totalEmployees: 0,
      recentSignups: 0,
    };
  }
}
