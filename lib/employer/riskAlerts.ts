/**
 * Employer risk alerts for a candidate.
 * Neutral language. Data from: disputes, verification coverage, references, employment gaps, dispute activity.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type RiskLevel = "low" | "medium" | "high";

export type RiskAlert = {
  id: string;
  message: string;
  /** Optional category for grouping */
  category?: string;
};

export type RiskAlertsResult = {
  riskLevel: RiskLevel;
  alerts: RiskAlert[];
};

function capAlerts(alerts: RiskAlert[], max: number): RiskAlert[] {
  return alerts.slice(0, max);
}

/**
 * Compute risk level from alerts: any high-severity → high; 2+ medium → medium; else low.
 */
function toRiskLevel(alerts: RiskAlert[]): RiskLevel {
  const hasUnresolvedDispute = alerts.some(
    (a) => a.category === "dispute" || a.message.toLowerCase().includes("dispute")
  );
  const hasLowCoverage = alerts.some(
    (a) => a.category === "coverage" || a.message.toLowerCase().includes("verif")
  );
  const hasConflict = alerts.some(
    (a) => a.category === "conflict" || a.message.toLowerCase().includes("conflict")
  );
  const hasGap = alerts.some(
    (a) => a.category === "gap" || a.message.toLowerCase().includes("gap")
  );
  const hasRecentDispute = alerts.some(
    (a) => a.category === "recent_dispute" || a.message.toLowerCase().includes("recent")
  );

  if (
    hasUnresolvedDispute ||
    hasRecentDispute ||
    (hasLowCoverage && hasConflict) ||
    alerts.length >= 4
  ) {
    return "high";
  }
  if (
    hasLowCoverage ||
    hasConflict ||
    hasGap ||
    alerts.length >= 2
  ) {
    return "medium";
  }
  return "low";
}

export async function getEmployerRiskAlerts(
  supabase: SupabaseClient,
  candidateId: string
): Promise<RiskAlertsResult> {
  const alerts: RiskAlert[] = [];
  let alertId = 0;
  const nextId = () => `risk-${++alertId}`;

  const [disputes, employmentRecords, refs, trustEvents] = await Promise.all([
    supabase
      .from("compliance_disputes")
      .select("id, status, created_at")
      .or(`profile_id.eq.${candidateId},user_id.eq.${candidateId}`),
    supabase
      .from("employment_records")
      .select("id, verification_status, start_date, end_date")
      .eq("user_id", candidateId)
      .order("start_date", { ascending: true }),
    supabase
      .from("user_references")
      .select("id, rating, from_user_id")
      .eq("to_user_id", candidateId)
      .eq("is_deleted", false),
    supabase
      .from("trust_events")
      .select("id, event_type, impact, created_at")
      .eq("profile_id", candidateId)
      .eq("event_type", "dispute")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const disputeList = (disputes.data ?? []) as { id: string; status: string; created_at: string }[];
  const recordList = (employmentRecords.data ?? []) as {
    id: string;
    verification_status: string;
    start_date: string;
    end_date: string | null;
  }[];
  const refList = (refs.data ?? []) as { id: string; rating?: number; from_user_id: string }[];
  const disputeEvents = (trustEvents.data ?? []) as { id: string; created_at: string }[];

  const unresolved = disputeList.filter(
    (d) =>
      String(d.status).toLowerCase() !== "resolved" &&
      String(d.status).toLowerCase() !== "rejected"
  );
  if (unresolved.length > 0) {
    alerts.push({
      id: nextId(),
      message:
        unresolved.length === 1
          ? "One unresolved dispute on file."
          : `${unresolved.length} unresolved disputes on file.`,
      category: "dispute",
    });
  }

  const totalRoles = recordList.length;
  const verifiedRoles = recordList.filter((r) => r.verification_status === "verified").length;
  const coveragePct = totalRoles > 0 ? (verifiedRoles / totalRoles) * 100 : 0;
  if (totalRoles > 0 && coveragePct < 50) {
    const unverified = totalRoles - verifiedRoles;
    alerts.push({
      id: nextId(),
      message:
        unverified === 1
          ? "One role not independently verified."
          : `${unverified} roles not independently verified.`,
      category: "coverage",
    });
  }

  const empRefs = await supabase
    .from("employment_references")
    .select("id, rating")
    .eq("reviewed_user_id", candidateId);
  const empRefList = (empRefs.data ?? []) as { id: string; rating?: number }[];
  const allRefs = [...refList, ...empRefList];
  const ratings = allRefs.map((r) => (typeof r.rating === "number" ? r.rating : 3));
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const hasConflict = ratings.length >= 2 && (Math.max(...ratings) - Math.min(...ratings) >= 2);
  if (hasConflict) {
    alerts.push({
      id: nextId(),
      message: "Reference ratings vary; consider reviewing in context.",
      category: "conflict",
    });
  }

  const now = new Date();
  for (let i = 1; i < recordList.length; i++) {
    const prev = recordList[i - 1];
    const curr = recordList[i];
    const prevEnd = prev.end_date ? new Date(prev.end_date) : now;
    const currStart = new Date(curr.start_date);
    const gapMonths = (currStart.getTime() - prevEnd.getTime()) / (30 * 24 * 60 * 60 * 1000);
    if (gapMonths > 24) {
      alerts.push({
        id: nextId(),
        message: "Employment history includes a gap of over two years.",
        category: "gap",
      });
      break;
    }
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentDisputeEvent = disputeEvents.find(
    (e) => new Date(e.created_at) >= ninetyDaysAgo
  );
  if (recentDisputeEvent && unresolved.length > 0) {
    alerts.push({
      id: nextId(),
      message: "Recent dispute activity on record.",
      category: "recent_dispute",
    });
  }

  const riskLevel = toRiskLevel(alerts);
  return {
    riskLevel,
    alerts: capAlerts(alerts, 10),
  };
}
