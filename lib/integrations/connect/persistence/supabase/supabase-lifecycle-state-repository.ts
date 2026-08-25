import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { LifecycleStateRecord } from "../../orchestration/types";
import type { LifecycleStateRepository } from "../repositories/lifecycle-state-repository";

function mapRow(row: Record<string, unknown>): LifecycleStateRecord {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    employerAccountId: String(row.employer_account_id),
    externalCandidateId: String(row.external_candidate_id),
    state: row.state as LifecycleStateRecord["state"],
    previousState: row.previous_state
      ? (row.previous_state as LifecycleStateRecord["previousState"])
      : undefined,
    lastEventType: row.last_event_type ? String(row.last_event_type) : undefined,
    lastDecision: row.last_decision
      ? (row.last_decision as LifecycleStateRecord["lastDecision"])
      : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseLifecycleStateRepository implements LifecycleStateRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(
    input: Omit<LifecycleStateRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<LifecycleStateRecord> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("connect_lifecycle_state")
      .upsert(
        {
          id: input.id ?? randomUUID(),
          connection_id: input.connectionId,
          employer_account_id: input.employerAccountId,
          external_candidate_id: input.externalCandidateId,
          state: input.state,
          previous_state: input.previousState ?? null,
          last_event_type: input.lastEventType ?? null,
          last_decision: input.lastDecision ?? null,
          metadata: input.metadata ?? {},
          updated_at: now,
        },
        { onConflict: "connection_id,external_candidate_id" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Lifecycle state upsert failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getByCandidate(
    connectionId: string,
    externalCandidateId: string
  ): Promise<LifecycleStateRecord | null> {
    const { data, error } = await this.client
      .from("connect_lifecycle_state")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("external_candidate_id", externalCandidateId)
      .maybeSingle();
    if (error) throw new Error(`Lifecycle state get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string): Promise<LifecycleStateRecord[]> {
    const { data, error } = await this.client
      .from("connect_lifecycle_state")
      .select("*")
      .eq("connection_id", connectionId);
    if (error) throw new Error(`Lifecycle state list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
