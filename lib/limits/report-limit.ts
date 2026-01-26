/**
 * Verification Report Limit Engine
 * 
 * Tracks and enforces monthly report limits per employer subscription tier.
 * Similar to search limit engine.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPlanFeatures } from "@/lib/stripePlans";

export interface ReportUsage {
  employerId: string;
  currentMonth: number;
  limit: number;
  remaining: number;
  resetDate: Date;
}

/**
 * Get current report usage for an employer
 */
export async function getReportUsage(employerId: string, tierId: string): Promise<ReportUsage> {
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  // Get plan features to determine limit
  const planFeatures = getPlanFeatures(tierId);
  const limit = planFeatures.reportsPerMonth === -1 ? Infinity : planFeatures.reportsPerMonth;

  // Get current month's usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const { data: reports, error } = await supabaseAny
    .from("verification_reports")
    .select("id")
    .eq("employer_id", employerId)
    .gte("created_at", monthStart.toISOString())
    .lte("created_at", monthEnd.toISOString());

  if (error) {
    console.error("Error fetching report usage:", error);
    return {
      employerId,
      currentMonth: 0,
      limit,
      remaining: limit === Infinity ? Infinity : limit,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const currentMonth = reports?.length || 0;
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
 * Check if employer can generate a report
 */
export async function canGenerateReport(employerId: string, tierId: string): Promise<boolean> {
  const usage = await getReportUsage(employerId, tierId);
  return usage.remaining > 0 || usage.limit === Infinity;
}

/**
 * Record a report generation (increment usage)
 */
export async function recordReport(employerId: string, workerId: string, reportType: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const supabaseAny = supabase as any;

  const { error } = await supabaseAny
    .from("verification_reports")
    .insert({
      employer_id: employerId,
      worker_id: workerId,
      report_type: reportType,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error recording report:", error);
    throw new Error("Failed to record report");
  }
}
