// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/candidate/[id]/network-depth
 * Employer-only. Same shape as trust/network-depth for candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import { toNetworkDepthBand } from "@/lib/trust/depthBands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DepthBand = "weak" | "moderate" | "strong";

function toDepthBand(score: number): DepthBand {
  if (score <= 2) return "weak";
  if (score <= 5) return "moderate";
  return "strong";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: profileId } = await params;
    if (!profileId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }
    const { data: rows, error } = await admin.from("trust_relationships")
      .select("source_profile_id, target_profile_id, relationship_type")
      .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (rows ?? []) as Array<{
      source_profile_id: string;
      target_profile_id: string;
      relationship_type: string;
    }>;
    const directConnections = list.filter((r) => r.source_profile_id === profileId).length;
    const managerConfirmations = list.filter((r) => r.relationship_type === "manager_confirmation").length;
    const coworkerConnections = list.filter((r) => r.relationship_type === "coworker_overlap").length;
    const depthScore = directConnections + managerConfirmations * 2;
    const depthBand = toDepthBand(depthScore);
    const connectionCount = list.length;
    const networkDepthBand = toNetworkDepthBand(connectionCount);

    return NextResponse.json({
      depthScore,
      depthBand,
      networkDepthBand,
      connectionCount,
      directConnections,
      managerConfirmations,
      coworkerConnections,
    });
  } catch (e) {
    console.error("[employer/candidate/network-depth]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
