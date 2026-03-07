/**
 * GET /api/trust/network-depth/[profileId]
 * Returns trust graph depth score and band from trust_relationships.
 * Algorithm: direct_connections (source_profile_id = profile) + (manager_connections * 2);
 * band: 0–2 weak, 3–5 moderate, 6+ strong.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toDepthBand } from "@/lib/trust/depthBands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type DepthBand = "weak" | "moderate" | "strong";

export type TrustNetworkDepthResponse = {
  depthScore: number;
  depthBand: DepthBand;
  connectionCount: number;
  directConnections: number;
  managerConfirmations: number;
  coworkerConnections: number;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const isAdmin =
    effective.role === "admin" || effective.role === "superadmin" || effective.role === "super_admin";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from("trust_relationships")
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

  const depthScore = directConnections + managerConfirmations * 2; // see lib/trust/depthBands
  const depthBand = toDepthBand(depthScore);
  const connectionCount = list.length;

  const response: TrustNetworkDepthResponse = {
    depthScore,
    depthBand,
    connectionCount,
    directConnections,
    managerConfirmations,
    coworkerConnections,
  };

  return NextResponse.json(response);
}
