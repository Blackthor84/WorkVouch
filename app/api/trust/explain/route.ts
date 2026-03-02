import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import type { TrustEngineSnapshot } from "@/lib/trust/types";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** User-facing trust band label from score (read-only, no admin metadata). */
function getTrustBandLabel(trustScore: number): string {
  if (trustScore < 40) return "Needs Improvement";
  if (trustScore < 60) return "Fair";
  if (trustScore < 80) return "Good";
  return "Excellent";
}

/** Build short explanation prose from top/risk factors (user-safe). */
function buildExplanationProse(topFactors: string[], riskFactors: string[]): string {
  const parts: string[] = [];
  if (topFactors.length > 0) {
    const friendly = topFactors
      .map((f) => {
        if (f === "meets_employer_threshold") return "meeting employer verification standards";
        if (f === "meets_industry_confidence") return "strong industry confidence";
        if (f === "verified_signals") return "verified employment signals";
        if (f === "strong_peer_network") return "strong peer reference network";
        if (f === "profile_strength") return "complete profile";
        return f.replace(/_/g, " ");
      })
      .join(", ");
    parts.push(`Your score is supported by: ${friendly}.`);
  }
  if (riskFactors.length > 0) {
    const friendly = riskFactors
      .map((f) => {
        if (f === "fraud_or_dispute") return "fraud or dispute signals";
        if (f === "conflicting_claims") return "conflicting claims";
        if (f === "no_verification") return "lack of verification";
        return f.replace(/_/g, " ");
      })
      .join(", ");
    parts.push(`Consider: ${friendly}.`);
  }
  if (parts.length === 0) return "Your trust score is based on verified employment, references, and profile strength.";
  return parts.join(" ");
}

/** User-safe score history event (no triggered_by or other admin metadata). */
export type TrustScoreHistoryEvent = {
  event: string;
  impact: number | null;
  date: string;
};

/**
 * GET /api/trust/explain — explainability: trust score, top factors, risk factors, confidence.
 * Uses effective user (impersonation-aware). Optional query: profileId (admin viewing a user).
 * When profileId === effective.id, also returns last 5–10 score change events (user-facing only).
 */
export async function GET(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId")?.trim() || effective.id;

  const supabase = getSupabaseServer();
  const row = await getOrCreateSnapshot(profileId);
  const trustScore = Math.max(0, Math.min(100, Number(row.career_health_score) ?? 0));
  const profileStrength = Math.max(0, Math.min(100, Number(row.profile_strength) ?? 0));
  const referenceScore = Math.max(0, Math.min(100, Number(row.reference_score) ?? 0));

  const { data: employmentRows } = await supabase
    .from("employment_records")
    .select("verification_status")
    .eq("user_id", profileId);
  const totalEmployment = (employmentRows ?? []).length;
  const verifiedCount = (employmentRows ?? []).filter(
    (r: { verification_status?: string }) => r.verification_status === "verified"
  ).length;
  const verifiedEmploymentCoveragePct =
    totalEmployment > 0 ? Math.round((verifiedCount / totalEmployment) * 100) : null;

  const snapshot: TrustEngineSnapshot = {
    trustScore,
    profileStrength,
    confidenceScore: referenceScore,
    industry: "retail",
    employerMode: "enterprise",
    actorMode: "employer",
    events: [],
    ledger: [],
  };

  const result = explainTrustScore(snapshot);
  const trustBandLabel = getTrustBandLabel(trustScore);
  const explanation = buildExplanationProse(result.topFactors, result.riskFactors);

  const trajectoryPayload = await getTrustTrajectory(profileId);

  const payload: {
    trustScore: number;
    topFactors: string[];
    riskFactors: string[];
    confidence: number;
    confidenceLevel: number;
    trustBandLabel: string;
    explanation: string;
    trustTrajectory: "improving" | "stable" | "at_risk";
    trustTrajectoryLabel: string;
    trustTrajectoryTooltipFactors: string[];
    scoreHistory?: TrustScoreHistoryEvent[];
  } = {
    ...result,
    confidenceLevel: result.confidence,
    trustBandLabel,
    explanation,
    trustTrajectory: trajectoryPayload.trajectory,
    trustTrajectoryLabel: trajectoryPayload.label,
    trustTrajectoryTooltipFactors: trajectoryPayload.tooltipFactors,
  };

  // Only include score history when user is viewing their own profile (read-only, user-safe).
  if (profileId === effective.id) {
    const { data: historyRows } = await supabase
      .from("intelligence_score_history")
      .select("reason, delta, created_at")
      .eq("user_id", effective.id)
      .eq("entity_type", "trust_score")
      .order("created_at", { ascending: false })
      .limit(10);

    type HistoryRow = { reason: string | null; delta: number | null; created_at: string };
    const rows: HistoryRow[] = Array.isArray(historyRows)
      ? historyRows.map((r) => ({
          reason: r?.reason != null ? String(r.reason) : null,
          delta: r?.delta != null ? Number(r.delta) : null,
          created_at: r?.created_at != null ? String(r.created_at) : "",
        }))
      : [];
    const scoreHistory: TrustScoreHistoryEvent[] = rows.map((r) => ({
      event: r.reason ?? "",
      impact: r.delta,
      date: r.created_at,
    }));
    payload.scoreHistory = scoreHistory;
  }

  return NextResponse.json(payload);
}
