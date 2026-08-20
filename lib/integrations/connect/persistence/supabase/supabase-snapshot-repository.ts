import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectEventSnapshotRow } from "../types";
import type { SnapshotRepository } from "../repositories/snapshot-repository";

function mapRow(row: Record<string, unknown>): ConnectEventSnapshotRow {
  return {
    id: String(row.id),
    aggregateType: row.aggregate_type as ConnectEventSnapshotRow["aggregateType"],
    aggregateId: String(row.aggregate_id),
    sequenceNumber: Number(row.sequence_number),
    state: (row.state as Record<string, unknown>) ?? {},
    eventCount: Number(row.event_count),
    snapshotType: row.snapshot_type as ConnectEventSnapshotRow["snapshotType"],
    createdAt: String(row.created_at),
  };
}

export class SupabaseSnapshotRepository implements SnapshotRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(row: Omit<ConnectEventSnapshotRow, "id" | "createdAt"> & { id?: string }): Promise<ConnectEventSnapshotRow> {
    const { data, error } = await this.client
      .from("connect_event_snapshots")
      .upsert(
        {
          id: row.id ?? randomUUID(),
          aggregate_type: row.aggregateType,
          aggregate_id: row.aggregateId,
          sequence_number: row.sequenceNumber,
          state: row.state,
          event_count: row.eventCount,
          snapshot_type: row.snapshotType,
        },
        { onConflict: "aggregate_type,aggregate_id,sequence_number" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Snapshot save failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getLatest(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow | null> {
    const { data, error } = await this.client
      .from("connect_event_snapshots")
      .select("*")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Snapshot get latest failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async getBySequence(aggregateType: string, aggregateId: string, sequenceNumber: number): Promise<ConnectEventSnapshotRow | null> {
    const { data, error } = await this.client
      .from("connect_event_snapshots")
      .select("*")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId)
      .eq("sequence_number", sequenceNumber)
      .maybeSingle();
    if (error) throw new Error(`Snapshot get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async list(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow[]> {
    const { data, error } = await this.client
      .from("connect_event_snapshots")
      .select("*")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId)
      .order("sequence_number", { ascending: true });
    if (error) throw new Error(`Snapshot list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
