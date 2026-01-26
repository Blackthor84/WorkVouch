/**
 * Search Limit Engine
 * 
 * Tracks and enforces monthly search limits per employer subscription tier.
 * Resets monthly via cron job or manual reset.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlanFeatures } from "@/lib/stripePlans";

export interface SearchUsage {
  employerId: string;
  currentMonth: number;
  limit: number;
  remaining: number;
  resetDate: Date;
}

/**
 * Get current search usage for an employer
 */
export async function getSearchUsage(employerId: string, tierId: string): Promise<SearchUsage> {
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  // Get plan features to determine limit
  const planFeatures = getPlanFeatures(tierId);
  const limit = planFeatures.searchesPerMonth === -1 ? Infinity : planFeatures.searchesPerMonth;

  // Get current month's usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: searches, error } = await supabaseAny
    .from("employer_searches")
    .select("id")
    .eq("employer_id", employerId)
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  if (error) {
    console.error("Error fetching search usage:", error);
    return {
      employerId,
      currentMonth: 0,
      limit,
      remaining: limit === Infinity ? Infinity : limit,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const currentMonth = searches?.length || 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentMonth);

  return {
    employerId,
    currentMonth,
    limit,
    remaining,
    resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/**
 * Check if employer can perform a search
 */
export async function canPerformSearch(employerId: string, tierId: string): Promise<boolean> {
  const usage = await getSearchUsage(employerId, tierId);
  return usage.remaining > 0 || usage.limit === Infinity;
}

/**
 * Record a search (increment usage)
 */
export async function recordSearch(employerId: string, workerId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  const { error } = await supabaseAny
    .from("employer_searches")
    .insert({
      employer_id: employerId,
      worker_id: workerId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error recording search:", error);
    throw new Error("Failed to record search");
  }
}

/**
 * Reset monthly usage (called by cron job)
 */
export async function resetMonthlyUsage(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  // This would typically be done via a database function or cron job
  // For now, we track by month in queries
  console.log("Monthly usage reset - handled by date-based queries");
}
