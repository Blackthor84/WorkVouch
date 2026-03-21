/**
 * GET /api/employer/confidence/[candidateId]
 * Employer-only. Returns hiring confidence: confidenceLevel (HIGH | MEDIUM | LOW), positives, cautions.
 * Based on: verification coverage, reference consistency, dispute status, trust trajectory.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";
import { getHiringConfidence } from "@/lib/employer/hiringConfidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type EmployerConfidenceResponse = {
  confidenceLevel: ConfidenceLevel;
  positives: string[];
  cautions: string[];
};

function toConfidenceLevel(level: "high" | "medium" | "low"): ConfidenceLevel {
  return level.toUpperCase() as ConfidenceLevel;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const userIsEmployer = await isEmployer();
    if (!user || !userIsEmployer) {
      return NextResponse.json(
        { error: "Forbidden: Employer access required" },
        { status: 403 }
      );
    }

    const disclaimerResponse = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimerResponse) return disclaimerResponse;

    const access = await resolveEmployerDataAccess(user.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    if (access.mode === "free_preview") {
      return NextResponse.json({
        entitlements: {
          tier: access.plan,
          limitedPreview: true,
          upgradeUrl: "/enterprise/upgrade",
        },
        locked: true,
        message: "Unlock full trust breakdown with Pro",
        confidenceLevel: null,
        positives: [] as string[],
        cautions: [] as string[],
      });
    }

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 }
      );
    }

    const payload = await getHiringConfidence(candidateId);
    const response: EmployerConfidenceResponse = {
      confidenceLevel: toConfidenceLevel(payload.level),
      positives: payload.positives ?? [],
      cautions: payload.cautions ?? [],
    };
    return NextResponse.json(response);
  } catch (e) {
    console.error("[employer/confidence]", e);
    return NextResponse.json(
      { error: "Failed to load hiring confidence" },
      { status: 500 }
    );
  }
}
