/**
 * GET /api/trust/graph/[candidateId]
 * Returns nodes and edges for Trust Graph visualization.
 * Depth 2, max 50 nodes. Employer or admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runFraudDetection } from "@/lib/trust/fraudDetection";
import type { GraphNode, GraphEdge, TrustGraphData } from "@/types/trustGraph";
import type { TrustRelationshipType } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_NODES = 50;

type RelRow = {
  source_profile_id: string;
  target_profile_id: string;
  relationship_type: TrustRelationshipType;
  created_at: string;
};

function nodeType(rel: TrustRelationshipType): "manager" | "coworker" {
  return rel === "manager_confirmation" ? "manager" : "coworker";
}

function edgeLabel(rel: TrustRelationshipType): string {
  return rel === "manager_confirmation" ? "Manager confirmation" : "Verified coworker";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await params;
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isEmployer = effective.role === "employer";
  if (!isAdmin && !isEmployer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sb = getSupabaseServer();

  const { data: profileRow } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", candidateId)
    .maybeSingle();

  const candidateName =
    (profileRow as { full_name?: string } | null)?.full_name ?? "Candidate";

  const { data: level1Rows, error: level1Error } = await sb
    .from("trust_relationships")
    .select("source_profile_id, target_profile_id, relationship_type, created_at")
    .or(`source_profile_id.eq.${candidateId},target_profile_id.eq.${candidateId}`);

  if (level1Error) {
    return NextResponse.json({ error: level1Error.message }, { status: 500 });
  }

  const level1List = (level1Rows ?? []) as unknown as RelRow[];
  const level1Ids = new Set<string>();
  const level1Edges: RelRow[] = [];
  for (const r of level1List) {
    if (level1Ids.size >= MAX_NODES - 1) break;
    const other =
      r.source_profile_id === candidateId
        ? r.target_profile_id
        : r.source_profile_id;
    level1Ids.add(other);
    level1Edges.push(r);
  }

  const allIds = new Set<string>([candidateId, ...level1Ids]);
  let level2Edges: RelRow[] = [];
  if (level1Ids.size > 0 && allIds.size < MAX_NODES) {
    const level1Arr = [...level1Ids];
    const inClause = `(${level1Arr.join(",")})`;
    const { data: level2Rows } = await sb
      .from("trust_relationships")
      .select("source_profile_id, target_profile_id, relationship_type, created_at")
      .or(`source_profile_id.in.${inClause},target_profile_id.in.${inClause}`);
    const raw = (level2Rows ?? []) as unknown as RelRow[];
    for (const r of raw) {
      const a = r.source_profile_id;
      const b = r.target_profile_id;
      if (a === candidateId || b === candidateId) continue;
      if (!level1Ids.has(a) && !level1Ids.has(b)) continue;
      if (allIds.has(a) && allIds.has(b)) {
        level2Edges.push(r);
        continue;
      }
      const other = level1Ids.has(a) ? b : a;
      if (allIds.size >= MAX_NODES) break;
      allIds.add(other);
      level2Edges.push(r);
    }
  }

  const profileIdsToFetch = [...allIds];
  const { data: profileRows } = await sb
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIdsToFetch);

  const nameMap = new Map<string, string>();
  for (const p of (profileRows ?? []) as unknown as { id: string; full_name: string | null }[]) {
    nameMap.set(p.id, p.full_name ?? "Unknown");
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  nodes.push({
    id: candidateId,
    label: candidateName,
    type: "candidate",
  });

  for (const r of level1Edges) {
    const other =
      r.source_profile_id === candidateId
        ? r.target_profile_id
        : r.source_profile_id;
    const nid = `node_${other}`;
    if (!nodes.some((n) => n.id === other)) {
      nodes.push({
        id: other,
        label: nameMap.get(other) ?? other.slice(0, 8),
        type: nodeType(r.relationship_type),
        verificationType: edgeLabel(r.relationship_type),
        timestamp: r.created_at,
      });
    }
    const eid = `${candidateId}-${other}`;
    if (!seenEdges.has(eid)) {
      seenEdges.add(eid);
      edges.push({
        id: eid,
        source: candidateId,
        target: other,
        label: edgeLabel(r.relationship_type),
        timestamp: r.created_at,
      });
    }
  }

  for (const r of level2Edges) {
    const a = r.source_profile_id;
    const b = r.target_profile_id;
    if (!nodes.some((n) => n.id === a)) {
      nodes.push({
        id: a,
        label: nameMap.get(a) ?? a.slice(0, 8),
        type: nodeType(r.relationship_type),
        verificationType: edgeLabel(r.relationship_type),
        timestamp: r.created_at,
      });
    }
    if (!nodes.some((n) => n.id === b)) {
      nodes.push({
        id: b,
        label: nameMap.get(b) ?? b.slice(0, 8),
        type: nodeType(r.relationship_type),
        verificationType: edgeLabel(r.relationship_type),
        timestamp: r.created_at,
      });
    }
    const eid = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!seenEdges.has(eid)) {
      seenEdges.add(eid);
      edges.push({
        id: eid,
        source: a,
        target: b,
        label: edgeLabel(r.relationship_type),
        timestamp: r.created_at,
      });
    }
  }

  let suspicious = false;
  let suspiciousReason: string | undefined;
  try {
    const fraud = await runFraudDetection(sb);
    if (fraud.suspicious) {
      suspicious = true;
      suspiciousReason = fraud.reason;
    }
  } catch {
    // ignore
  }

  const data: TrustGraphData = {
    nodes,
    edges,
    suspicious: suspicious ? true : undefined,
    suspiciousReason,
  };

  return NextResponse.json(data);
}
