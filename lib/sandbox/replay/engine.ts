/**
 * Sandbox Replay Engine - READ-ONLY. Replay does not mutate sandbox state.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type ReplayEventType =
  | "employment_claim"
  | "overlap_verification"
  | "review"
  | "trust_score_update"
  | "penalty"
  | "admin_action"
  | "playbook_action"
  | "incident";

export type ReplayEventRow = {
  id: string;
  replay_session_id: string;
  event_order: number;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  trust_score_before: number | null;
  trust_score_after: number | null;
  rule_version_id: string | null;
  reason: string | null;
  created_at: string;
};

export type ReplaySessionRow = {
  id: string;
  sandbox_id: string;
  snapshot_id: string | null;
  name: string;
  status: string;
  rule_version_id: string | null;
  created_by: string | null;
  created_at: string;
};

export async function getReplaySessionWithEvents(replaySessionId: string): Promise<{
  session: ReplaySessionRow | null;
  events: ReplayEventRow[];
}> {
  const sb = getSupabaseServer();
  const { data: session } = await sb.from("sandbox_replay_sessions").select("*").eq("id", replaySessionId).single();
  if (!session) return { session: null, events: [] };
  const { data: events } = await sb
    .from("sandbox_replay_events")
    .select("*")
    .eq("replay_session_id", replaySessionId)
    .order("event_order", { ascending: true });
  return { session: session as ReplaySessionRow, events: (events ?? []) as ReplayEventRow[] };
}

export async function listReplaySessions(sandboxId: string): Promise<ReplaySessionRow[]> {
  const sb = getSupabaseServer();
  const { data } = await sb.from("sandbox_replay_sessions").select("*").eq("sandbox_id", sandboxId).order("created_at", { ascending: false });
  return (data ?? []) as ReplaySessionRow[];
}

export async function createSandboxSnapshot(params: {
  sandboxId: string;
  name?: string;
  createdBy?: string | null;
}): Promise<{ id: string } | null> {
  const sb = getSupabaseServer();
  const [emp, recs, revs, intel] = await Promise.all([
    sb.from("sandbox_employees").select("*").eq("sandbox_id", params.sandboxId),
    sb.from("sandbox_employment_records").select("*").eq("sandbox_id", params.sandboxId),
    sb.from("sandbox_peer_reviews").select("*").eq("sandbox_id", params.sandboxId),
    sb.from("sandbox_intelligence_outputs").select("*").eq("sandbox_id", params.sandboxId),
  ]);
  const state_snapshot = {
    employees: emp.data ?? [],
    employment_records: recs.data ?? [],
    peer_reviews: revs.data ?? [],
    intelligence_outputs: intel.data ?? [],
    captured_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from("sandbox_snapshots")
    .insert({
      sandbox_id: params.sandboxId,
      name: params.name ?? "Snapshot",
      snapshot_type: "full",
      state_snapshot,
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (error) return null;
  return data as { id: string };
}

export async function createReplaySession(params: {
  sandboxId: string;
  name: string;
  snapshotId?: string | null;
  ruleVersionId?: string | null;
  createdBy?: string | null;
}): Promise<{ id: string } | null> {
  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from("sandbox_replay_sessions")
    .insert({
      sandbox_id: params.sandboxId,
      name: params.name,
      snapshot_id: params.snapshotId ?? null,
      rule_version_id: params.ruleVersionId ?? null,
      status: "draft",
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (error) return null;
  return data as { id: string };
}

export async function addReplayEvent(params: {
  replaySessionId: string;
  eventOrder: number;
  eventType: ReplayEventType;
  entityType?: string | null;
  entityId?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  trustScoreBefore?: number | null;
  trustScoreAfter?: number | null;
  ruleVersionId?: string | null;
  reason?: string | null;
}): Promise<{ id: string } | null> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.from("sandbox_replay_events").insert({
    replay_session_id: params.replaySessionId,
    event_order: params.eventOrder,
    event_type: params.eventType,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    before_state: params.beforeState ?? null,
    after_state: params.afterState ?? null,
    trust_score_before: params.trustScoreBefore ?? null,
    trust_score_after: params.trustScoreAfter ?? null,
    rule_version_id: params.ruleVersionId ?? null,
    reason: params.reason ?? null,
  }).select("id").single();
  if (error) return null;
  return data as { id: string };
}
