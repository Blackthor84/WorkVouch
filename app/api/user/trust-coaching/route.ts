/**
 * GET /api/user/trust-coaching — Inputs and suggestions for "How to Strengthen Your Trust".
 * Suggestions are only when conditions are true: missing verification, lack of recent references, unresolved disputes.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustTrajectoryInput } from "@/lib/trust/trustTrajectory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = await getTrustTrajectoryInput(effective.id);
  const suggestions: string[] = [];

  if (input.verifiedEmploymentCount === 0) {
    suggestions.push("Add and verify at least one employment record so employers can confirm your work history. Go to Job History and request verification from your employer or use a verified source.");
  }

  const refDays = input.daysSinceLastReference;
  if (input.referenceCount === 0) {
    suggestions.push("Request references from coworkers or managers. References from people who worked with you strengthen your profile and trust score.");
  } else if (refDays != null && refDays > 365) {
    suggestions.push("Your most recent reference is over a year old. Consider asking a recent coworker or manager for a new reference to keep your profile strong.");
  }

  if (input.hasOpenDispute) {
    suggestions.push("You have an open or under-review dispute. Resolving it can help your trust trajectory. Check your disputes and provide any requested information.");
  }

  return NextResponse.json({
    suggestions,
    trajectoryInput: {
      verifiedEmploymentCount: input.verifiedEmploymentCount,
      referenceCount: input.referenceCount,
      hasOpenDispute: input.hasOpenDispute,
      daysSinceLastVerification: input.daysSinceLastVerification,
      daysSinceLastReference: input.daysSinceLastReference,
    },
  });
}
