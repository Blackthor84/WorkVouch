/**
 * GET /api/trust/network/[profileId]
 * Returns trust graph: connections, connectionCount, depthBand (minimal|moderate|strong|exceptional).
 * Also returns direct_connections, manager_confirmations, coworker_overlaps for backward compat.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TrustRelationshipType, TrustVerificationLevel } from "@/types/database";
import { toNetworkDepthBand } from "@/lib/trust/depthBands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** User-facing relationship type (manager, coworker, direct_report, client, vendor) */
export type ConnectionRelationshipType = "manager" | "coworker" | "direct_report" | "client" | "vendor";

export type TrustNetworkNode = {
  profile_id: string;
  full_name: string | null;
  relationship_type: TrustRelationshipType;
  verification_level: TrustVerificationLevel;
  created_at: string;
};

export type TrustNetworkConnection = {
  profile_id: string;
  full_name: string | null;
  relationship_type: ConnectionRelationshipType;
  verification_level: TrustVerificationLevel;
  created_at: string;
};

export type TrustNetworkResponse = {
  connections: TrustNetworkConnection[];
  connectionCount: number;
  depthBand: "minimal" | "moderate" | "strong" | "exceptional";
  direct_connections: TrustNetworkNode[];
  manager_confirmations: TrustNetworkNode[];
  coworker_overlaps: TrustNetworkNode[];
};

function toConnectionType(t: TrustRelationshipType): ConnectionRelationshipType {
  if (t === "manager_confirmation") return "manager";
  if (t === "coworker_overlap") return "coworker";
  if (t === "peer_reference") return "coworker";
  return "coworker";
}

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

  const supabase = await createServerSupabase();
  const isAdmin =
    effective.role === "admin" || effective.role === "superadmin" || effective.role === "super_admin";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: edges, error: edgesError } = await supabase
    .from("trust_relationships")
    .select("id, source_profile_id, target_profile_id, relationship_type, verification_level, created_at")
    .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);

  if (edgesError) {
    return NextResponse.json({ error: edgesError.message }, { status: 500 });
  }

  const list = (edges ?? []) as Array<{
    id: string;
    source_profile_id: string;
    target_profile_id: string;
    relationship_type: TrustRelationshipType;
    verification_level: TrustVerificationLevel;
    created_at: string;
  }>;

  const otherIds = [...new Set(list.map((e) => (e.source_profile_id === profileId ? e.target_profile_id : e.source_profile_id)))];
  const profileMap = new Map<string, { full_name: string | null }>();
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", otherIds);
    for (const p of profiles ?? []) {
      profileMap.set((p as { id: string; full_name: string | null }).id, {
        full_name: (p as { full_name: string | null }).full_name ?? null,
      });
    }
  }

  const toNode = (e: (typeof list)[0]): TrustNetworkNode => {
    const otherId = e.source_profile_id === profileId ? e.target_profile_id : e.source_profile_id;
    const { full_name } = profileMap.get(otherId) ?? { full_name: null };
    return {
      profile_id: otherId,
      full_name,
      relationship_type: e.relationship_type,
      verification_level: e.verification_level,
      created_at: e.created_at,
    };
  };

  const dedupeByProfile = (nodes: TrustNetworkNode[]): TrustNetworkNode[] => {
    const seen = new Set<string>();
    return nodes.filter((n) => {
      if (seen.has(n.profile_id)) return false;
      seen.add(n.profile_id);
      return true;
    });
  };

  const direct_connections = dedupeByProfile(
    list.filter((e) => e.relationship_type === "peer_reference").map(toNode)
  );
  const manager_confirmations = dedupeByProfile(
    list.filter((e) => e.relationship_type === "manager_confirmation").map(toNode)
  );
  const coworker_overlaps = dedupeByProfile(
    list.filter((e) => e.relationship_type === "coworker_overlap").map(toNode)
  );

  const connections: TrustNetworkConnection[] = list.map((e) => {
    const otherId = e.source_profile_id === profileId ? e.target_profile_id : e.source_profile_id;
    const { full_name } = profileMap.get(otherId) ?? { full_name: null };
    return {
      profile_id: otherId,
      full_name,
      relationship_type: toConnectionType(e.relationship_type),
      verification_level: e.verification_level,
      created_at: e.created_at,
    };
  });
  const uniqueCount = otherIds.length;
  const depthBand = toNetworkDepthBand(uniqueCount);

  const response: TrustNetworkResponse = {
    connections,
    connectionCount: uniqueCount,
    depthBand,
    direct_connections,
    manager_confirmations,
    coworker_overlaps,
  };

  return NextResponse.json(response);
}
