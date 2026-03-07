/**
 * GET /api/workvouch/profile/[id]
 * Recruiter API: profile_id, trust_score, verification_count, manager_confirmations, coworker_confirmations, network_depth.
 * Data computed from trust_events and trust_relationships.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEffectiveUser } from "@/lib/auth";
import { calculateTrustScore } from "@/lib/trust/trustScore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: "Profile id required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = getSupabaseServer();

  const [eventsRes, relRes, trustScore] = await Promise.all([
    sb.from("trust_events").select("event_type").eq("profile_id", profileId),
    sb
      .from("trust_relationships")
      .select("relationship_type")
      .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`),
    calculateTrustScore(profileId),
  ]);

  const events = (eventsRes.data ?? []) as unknown as { event_type: string }[];
  const rels = (relRes.data ?? []) as unknown as { relationship_type: string }[];

  const coworkerConfirmations = events.filter(
    (e) =>
      e.event_type === "coworker_verified" ||
      e.event_type === "coworker_verification_confirmed"
  ).length;
  const managerConfirmations = events.filter(
    (e) =>
      e.event_type === "manager_verified" ||
      e.event_type === "employment_verified" ||
      e.event_type === "verification_confirmed"
  ).length;
  const verificationCount = coworkerConfirmations + managerConfirmations;
  const networkDepth = rels.length;

  return NextResponse.json({
    profile_id: profileId,
    trust_score: trustScore,
    verification_count: verificationCount,
    manager_confirmations: managerConfirmations,
    coworker_confirmations: coworkerConfirmations,
    network_depth: networkDepth,
  });
}
