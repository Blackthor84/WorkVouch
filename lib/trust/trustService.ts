import { getEffectiveUser } from "@/lib/auth";
import {
  calculateTrust,
  loadTrustTimeline,
  type TrustCalculationResult,
  type TrustTimelineEntry,
} from "@/lib/trust/trustEngine";
import { admin } from "@/lib/supabase-admin";

export type TrustProfileResponse = TrustCalculationResult & {
  timeline: TrustTimelineEntry[];
  verificationSummary: {
    verifiedEmploymentCount: number;
    referenceCount: number;
    coveragePct: number | null;
  };
  recentChanges: Array<{ event: string; impact: number | null; date: string }>;
};

export type TrustAccessResult =
  | { ok: false; status: number; error: string }
  | { ok: true; data: TrustProfileResponse };

async function canViewTrust(
  viewerId: string,
  viewerRole: string | null | undefined,
  profileId: string,
): Promise<boolean> {
  if (viewerId === profileId) return true;
  const role = (viewerRole ?? "").toLowerCase();
  if (role === "admin" || role === "superadmin" || role === "super_admin") return true;
  if (role === "employer") return true;
  return false;
}

/**
 * Canonical trust loader — every page/API should use this.
 */
export async function getTrustProfile(profileId: string): Promise<TrustAccessResult> {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const allowed = await canViewTrust(effective.id, effective.role, profileId);
  if (!allowed) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const [trust, timeline] = await Promise.all([
    calculateTrust(profileId),
    loadTrustTimeline(profileId),
  ]);

  const { data: employmentRows } = await admin
    .from("employment_records")
    .select("verification_status")
    .eq("user_id", profileId);

  const total = (employmentRows ?? []).length;
  const verified = (employmentRows ?? []).filter(
    (r: { verification_status?: string }) => r.verification_status === "verified",
  ).length;
  const coveragePct = total > 0 ? Math.round((verified / total) * 100) : null;

  let recentChanges: TrustProfileResponse["recentChanges"] = [];
  if (profileId === effective.id) {
    const { data: historyRows } = await admin
      .from("intelligence_score_history")
      .select("reason, delta, created_at")
      .eq("user_id", profileId)
      .eq("entity_type", "trust_score")
      .order("created_at", { ascending: false })
      .limit(10);

    recentChanges = ((historyRows ?? []) as {
      reason: string | null;
      delta: number | null;
      created_at: string;
    }[]).map((r) => ({
      event: r.reason ?? "",
      impact: r.delta,
      date: r.created_at,
    }));
  }

  return {
    ok: true,
    data: {
      ...trust,
      timeline,
      verificationSummary: {
        verifiedEmploymentCount: trust.verifiedEmploymentCount,
        referenceCount: trust.referenceCount,
        coveragePct,
      },
      recentChanges,
    },
  };
}
