/**
 * POST /api/employer/compare
 * Returns normalized comparison data for 2–4 candidates. No raw trust scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  getEmployeeAuditScoresBatch,
  getAuditLabel,
  getAuditExplanation,
  type AuditBand,
} from "@/lib/scoring/employeeAuditScore";
import { getTrustTrajectoryBatch } from "@/lib/trust/trustTrajectory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  candidateIds: z
    .array(z.string().uuid())
    .min(2, "Select 2 to 4 candidates")
    .max(4, "Select 2 to 4 candidates"),
});

export type CompareCandidateItem = {
  candidateId: string;
  name: string | null;
  verificationSummary: string;
  verifiedEmploymentCount: number;
  totalEmploymentCount: number;
  verifiedEmploymentCoveragePct: number;
  trustBand: AuditBand;
  trustLabel: string;
  trustExplanation: string;
  referenceCount: number;
  flagIndicators: string[];
  trustTrajectory: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel: string;
  trustTrajectoryTooltipFactors: string[];
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userIsEmployer = await isEmployer();
    if (!user || !userIsEmployer) {
      return NextResponse.json(
        { error: "Forbidden: Employer access required" },
        { status: 403 },
      );
    }

    const disclaimerResponse = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimerResponse) return disclaimerResponse;

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors.candidateIds?.[0] ?? "Invalid request" },
        { status: 400 },
      );
    }

    const candidateIds = [...new Set(parsed.data.candidateIds)] as string[];
    if (candidateIds.length < 2 || candidateIds.length > 4) {
      return NextResponse.json(
        { error: "Select 2 to 4 candidates" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServer();

    const [profilesRes, auditMap, employmentCountsRes, trustRefCountsRes, fraudCountsRes, trajectoryMap] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, flagged_for_fraud")
          .in("id", candidateIds),
        getEmployeeAuditScoresBatch(candidateIds),
        supabase
          .from("employment_records")
          .select("user_id, verification_status")
          .in("user_id", candidateIds),
        supabase
          .from("trust_scores")
          .select("user_id, reference_count")
          .in("user_id", candidateIds),
        supabase
          .from("fraud_flags")
          .select("user_id")
          .in("user_id", candidateIds),
        getTrustTrajectoryBatch(candidateIds),
      ]);

    const profiles = (profilesRes.data ?? []) as {
      id: string;
      full_name: string | null;
      flagged_for_fraud: boolean | null;
    }[];
    const employmentRows = (employmentCountsRes.data ?? []) as {
      user_id: string;
      verification_status: string;
    }[];
    const trustRows = (trustRefCountsRes.data ?? []) as {
      user_id: string;
      reference_count: number | null;
    }[];
    const fraudRows = (fraudCountsRes.data ?? []) as { user_id: string }[];

    const totalCountByUser = new Map<string, number>();
    const verifiedCountByUser = new Map<string, number>();
    for (const r of employmentRows) {
      totalCountByUser.set(r.user_id, (totalCountByUser.get(r.user_id) ?? 0) + 1);
      if (r.verification_status === "verified") {
        verifiedCountByUser.set(
          r.user_id,
          (verifiedCountByUser.get(r.user_id) ?? 0) + 1,
        );
      }
    }
    const referenceCountByUser = new Map<string, number>();
    for (const t of trustRows) {
      referenceCountByUser.set(
        t.user_id,
        t.reference_count != null ? Number(t.reference_count) : 0,
      );
    }
    const fraudCountByUser = new Map<string, number>();
    for (const f of fraudRows) {
      fraudCountByUser.set(f.user_id, (fraudCountByUser.get(f.user_id) ?? 0) + 1);
    }

    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const candidates: CompareCandidateItem[] = candidateIds.map((candidateId) => {
      const profile = profileById.get(candidateId);
      const audit = auditMap.get(candidateId);
      const band: AuditBand = audit?.band ?? "unverified";
      const verifiedCount = verifiedCountByUser.get(candidateId) ?? 0;
      const totalCount = totalCountByUser.get(candidateId) ?? 0;
      const verifiedEmploymentCoveragePct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
      const refCount = referenceCountByUser.get(candidateId) ?? 0;
      const fraudCount = fraudCountByUser.get(candidateId) ?? 0;
      const trajectory = trajectoryMap.get(candidateId);
      const flags: string[] = [];
      if (profile?.flagged_for_fraud === true) flags.push("Profile flagged");
      if (fraudCount > 0) flags.push("Fraud flags on file");

      let verificationSummary: string;
      if (verifiedCount === 0) {
        verificationSummary = "No verified employment";
      } else if (verifiedCount === 1) {
        verificationSummary = "1 verified role";
      } else {
        verificationSummary = `${verifiedCount} verified roles`;
      }

      return {
        candidateId,
        name: profile?.full_name ?? null,
        verificationSummary,
        verifiedEmploymentCount: verifiedCount,
        totalEmploymentCount: totalCount,
        verifiedEmploymentCoveragePct,
        trustBand: band,
        trustLabel: getAuditLabel(band),
        trustExplanation: audit
          ? getAuditExplanation(band, audit.breakdown)
          : "Verification data not yet calculated.",
        referenceCount: refCount,
        flagIndicators: flags,
        trustTrajectory: trajectory?.trajectory ?? "stable",
        trustTrajectoryLabel: trajectory?.label ?? "Stable",
        trustTrajectoryTooltipFactors: trajectory?.tooltipFactors ?? [],
      };
    });

    return NextResponse.json({ candidates });
  } catch (e) {
    console.error("[employer/compare]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
