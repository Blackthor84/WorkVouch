/**
 * Trust Trajectory — deterministic "improving" | "stable" | "at_risk" from existing data.
 * Inputs: time since last verification, reference recency, dispute status, employment consistency.
 * No raw scores exposed. No ML. No new schema.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type TrustTrajectoryResult = "improving" | "stable" | "at_risk";

export type TrustTrajectoryPayload = {
  trajectory: TrustTrajectoryResult;
  label: string;
  tooltipFactors: string[];
};

const MS_PER_DAY = 86400 * 1000;

function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return null;
  return Math.floor((Date.now() - d) / MS_PER_DAY);
}

/**
 * Deterministic rules (no ML):
 * - at_risk: open dispute, or no recent verification/reference and low activity.
 * - improving: recent verification or reference, no open dispute, some consistency.
 * - stable: else.
 */
export function computeTrustTrajectory(input: {
  daysSinceLastVerification: number | null;
  daysSinceLastReference: number | null;
  hasOpenDispute: boolean;
  verifiedEmploymentCount: number;
  totalVerifiedYears: number;
  referenceCount: number;
}): TrustTrajectoryPayload {
  const {
    daysSinceLastVerification,
    daysSinceLastReference,
    hasOpenDispute,
    verifiedEmploymentCount,
    totalVerifiedYears,
    referenceCount,
  } = input;

  const tooltipFactors: string[] = [];
  if (daysSinceLastVerification != null) {
    if (daysSinceLastVerification <= 180) tooltipFactors.push("Recent verification activity");
    else if (daysSinceLastVerification <= 365) tooltipFactors.push("Verification within the last year");
    else tooltipFactors.push("Last verification was over a year ago");
  } else if (verifiedEmploymentCount === 0) {
    tooltipFactors.push("No verified employment yet");
  }
  if (referenceCount > 0) {
    if (daysSinceLastReference != null) {
      if (daysSinceLastReference <= 365) tooltipFactors.push("Recent reference activity");
      else tooltipFactors.push("References are over a year old");
    } else {
      tooltipFactors.push("Has references");
    }
  } else {
    tooltipFactors.push("No references yet");
  }
  if (hasOpenDispute) tooltipFactors.push("Open or under-review dispute");
  else tooltipFactors.push("No open disputes");
  if (verifiedEmploymentCount >= 2 && totalVerifiedYears >= 1) tooltipFactors.push("Consistent employment history");
  else if (verifiedEmploymentCount > 0) tooltipFactors.push("Building employment history");

  // NEVER improving when unresolved dispute exists
  if (hasOpenDispute) {
    return {
      trajectory: "at_risk",
      label: "At Risk",
      tooltipFactors,
    };
  }

  // At risk: no verification in 180+ days (or no verified employment) with no recent reference
  const noVerification180Plus =
    daysSinceLastVerification != null && daysSinceLastVerification >= 180;
  const noRecentReference =
    referenceCount === 0 || daysSinceLastReference == null || daysSinceLastReference > 730;
  const noRecentVerification = daysSinceLastVerification == null || daysSinceLastVerification > 365;
  if (
    noVerification180Plus ||
    (noRecentVerification && noRecentReference && (verifiedEmploymentCount === 0 || referenceCount === 0))
  ) {
    return {
      trajectory: "at_risk",
      label: "At Risk",
      tooltipFactors,
    };
  }

  const consistentEmployment = verifiedEmploymentCount >= 2 && totalVerifiedYears >= 0.5;
  const hasSomeActivity = verifiedEmploymentCount >= 1 || referenceCount >= 1;

  // Stable: verification older than 90 days, references older than 90 days, no disputes, consistent employment
  const verificationOlderThan90 = daysSinceLastVerification != null && daysSinceLastVerification > 90;
  const referencesOlderThan90 = daysSinceLastReference == null || daysSinceLastReference > 90;
  if (
    verificationOlderThan90 &&
    referencesOlderThan90 &&
    consistentEmployment &&
    referenceCount >= 1
  ) {
    return {
      trajectory: "stable",
      label: "Stable",
      tooltipFactors,
    };
  }

  // Improving: verification within 30 days, at least one reference within 60 days, no disputes
  const recentVerification30 = daysSinceLastVerification != null && daysSinceLastVerification <= 30;
  const recentReference60 = referenceCount > 0 && daysSinceLastReference != null && daysSinceLastReference <= 60;
  if (recentVerification30 && recentReference60 && hasSomeActivity) {
    return {
      trajectory: "improving",
      label: "Improving",
      tooltipFactors,
    };
  }
  // Improving: recent verification (≤180d) or recent reference (≤365d) with activity
  const recentVerification180 = daysSinceLastVerification != null && daysSinceLastVerification <= 180;
  const recentReference365 = referenceCount > 0 && daysSinceLastReference != null && daysSinceLastReference <= 365;
  if ((recentVerification180 || recentReference365) && hasSomeActivity) {
    return {
      trajectory: "improving",
      label: "Improving",
      tooltipFactors,
    };
  }

  return {
    trajectory: "stable",
    label: "Stable",
    tooltipFactors,
  };
}

export type TrustTrajectoryInput = {
  daysSinceLastVerification: number | null;
  daysSinceLastReference: number | null;
  hasOpenDispute: boolean;
  verifiedEmploymentCount: number;
  totalVerifiedYears: number;
  referenceCount: number;
};

/** Fetch inputs for one user from existing tables. */
export async function getTrustTrajectoryInput(userId: string): Promise<TrustTrajectoryInput> {
  const supabase = getSupabaseServer();

  const [verifiedRows, refRows, disputeRows, employmentForYears] = await Promise.all([
    supabase
      .from("employment_records")
      .select("updated_at")
      .eq("user_id", userId)
      .eq("verification_status", "verified")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("employment_references")
      .select("created_at")
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("disputes")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["open", "under_review"])
      .limit(1),
    supabase
      .from("employment_records")
      .select("start_date, end_date")
      .eq("user_id", userId)
      .eq("verification_status", "verified"),
  ]);

  const lastVerified =
    (verifiedRows.data as { updated_at: string }[] | null)?.[0]?.updated_at ?? null;
  const lastRef =
    (refRows.data as { created_at: string }[] | null)?.[0]?.created_at ?? null;
  const hasOpenDispute = Array.isArray(disputeRows.data) && disputeRows.data.length > 0;
  const employmentList = (employmentForYears.data ?? []) as {
    start_date: string;
    end_date: string | null;
  }[];
  const now = Date.now();
  let totalVerifiedYears = 0;
  for (const r of employmentList) {
    const start = new Date(r.start_date).getTime();
    const end = r.end_date ? new Date(r.end_date).getTime() : now;
    totalVerifiedYears += (end - start) / (365.25 * 24 * 60 * 60 * 1000);
  }

  const { data: trustRow } = await supabase
    .from("trust_scores")
    .select("reference_count")
    .eq("user_id", userId)
    .maybeSingle();
  const referenceCount = (trustRow as { reference_count?: number } | null)?.reference_count ?? 0;

  return {
    daysSinceLastVerification: daysAgo(lastVerified),
    daysSinceLastReference: daysAgo(lastRef),
    hasOpenDispute,
    verifiedEmploymentCount: employmentList.length,
    totalVerifiedYears,
    referenceCount,
  };
}

/** Single user: fetch inputs and compute. Returns payload only (no raw scores). */
export async function getTrustTrajectory(userId: string): Promise<TrustTrajectoryPayload> {
  const input = await getTrustTrajectoryInput(userId);
  return computeTrustTrajectory(input);
}

/** Batch: fetch inputs for many users and compute trajectory for each. */
export async function getTrustTrajectoryBatch(
  userIds: string[]
): Promise<Map<string, TrustTrajectoryPayload>> {
  if (userIds.length === 0) return new Map();

  const supabase = getSupabaseServer();
  const uniq = [...new Set(userIds)];

  const [verifiedRows, refRows, disputeRows, employmentRows, trustRows] = await Promise.all([
    supabase
      .from("employment_records")
      .select("user_id, updated_at")
      .in("user_id", uniq)
      .eq("verification_status", "verified")
      .order("updated_at", { ascending: false }),
    supabase
      .from("employment_references")
      .select("reviewed_user_id, created_at")
      .in("reviewed_user_id", uniq)
      .order("created_at", { ascending: false }),
    supabase
      .from("disputes")
      .select("user_id")
      .in("user_id", uniq)
      .in("status", ["open", "under_review"]),
    supabase
      .from("employment_records")
      .select("user_id, start_date, end_date")
      .in("user_id", uniq)
      .eq("verification_status", "verified"),
    supabase.from("trust_scores").select("user_id, reference_count").in("user_id", uniq),
  ]);

  type VerRow = { user_id: string; updated_at: string };
  type RefRow = { reviewed_user_id: string; created_at: string };
  type EmpRow = { user_id: string; start_date: string; end_date: string | null };
  type TrustRow = { user_id: string; reference_count: number | null };

  const lastVerByUser = new Map<string, string>();
  for (const r of (verifiedRows.data ?? []) as VerRow[]) {
    if (!lastVerByUser.has(r.user_id)) lastVerByUser.set(r.user_id, r.updated_at);
  }
  const lastRefByUser = new Map<string, string>();
  for (const r of (refRows.data ?? []) as RefRow[]) {
    if (!lastRefByUser.has(r.reviewed_user_id))
      lastRefByUser.set(r.reviewed_user_id, r.created_at);
  }
  const disputeData = (disputeRows.data ?? []) as { user_id: string }[];
  const openDisputeUserIds = new Set(disputeData.map((r) => r.user_id));
  const employmentByUser = new Map<string, { start_date: string; end_date: string | null }[]>();
  for (const r of (employmentRows.data ?? []) as EmpRow[]) {
    const list = employmentByUser.get(r.user_id) ?? [];
    list.push({ start_date: r.start_date, end_date: r.end_date });
    employmentByUser.set(r.user_id, list);
  }
  const refCountByUser = new Map<string, number>();
  for (const r of (trustRows.data ?? []) as TrustRow[]) {
    refCountByUser.set(r.user_id, r.reference_count != null ? Number(r.reference_count) : 0);
  }

  const result = new Map<string, TrustTrajectoryPayload>();
  for (const uid of uniq) {
    const empList = employmentByUser.get(uid) ?? [];
    const now = Date.now();
    let totalVerifiedYears = 0;
    for (const e of empList) {
      const start = new Date(e.start_date).getTime();
      const end = e.end_date ? new Date(e.end_date).getTime() : now;
      totalVerifiedYears += (end - start) / (365.25 * 24 * 60 * 60 * 1000);
    }
    const input: TrustTrajectoryInput = {
      daysSinceLastVerification: daysAgo(lastVerByUser.get(uid) ?? null),
      daysSinceLastReference: daysAgo(lastRefByUser.get(uid) ?? null),
      hasOpenDispute: openDisputeUserIds.has(uid),
      verifiedEmploymentCount: empList.length,
      totalVerifiedYears,
      referenceCount: refCountByUser.get(uid) ?? 0,
    };
    result.set(uid, computeTrustTrajectory(input));
  }
  return result;
}
