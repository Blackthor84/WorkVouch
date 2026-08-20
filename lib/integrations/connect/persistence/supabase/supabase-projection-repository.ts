import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ConnectProjectionStateRow } from "../types";
import type { ProjectionRepository } from "../repositories/projection-repository";

function mapRow(row: Record<string, unknown>): ConnectProjectionStateRow {
  return {
    id: String(row.id),
    aggregateType: row.aggregate_type as ConnectProjectionStateRow["aggregateType"],
    aggregateId: String(row.aggregate_id),
    projectionName: String(row.projection_name),
    sequenceNumber: Number(row.sequence_number),
    state: (row.state as Record<string, unknown>) ?? {},
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseProjectionRepository implements ProjectionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async get(
    aggregateType: string,
    aggregateId: string,
    projectionName: string
  ): Promise<ConnectProjectionStateRow | null> {
    const { data, error } = await this.client
      .from("connect_projection_state")
      .select("*")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId)
      .eq("projection_name", projectionName)
      .maybeSingle();
    if (error) throw new Error(`Projection get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async save(
    row: Omit<ConnectProjectionStateRow, "id" | "updatedAt"> & { id?: string }
  ): Promise<ConnectProjectionStateRow> {
    const { data, error } = await this.client
      .from("connect_projection_state")
      .upsert(
        {
          id: row.id ?? randomUUID(),
          aggregate_type: row.aggregateType,
          aggregate_id: row.aggregateId,
          projection_name: row.projectionName,
          sequence_number: row.sequenceNumber,
          state: row.state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "aggregate_type,aggregate_id,projection_name" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Projection save failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async listByAggregate(aggregateType: string, aggregateId: string): Promise<ConnectProjectionStateRow[]> {
    const { data, error } = await this.client
      .from("connect_projection_state")
      .select("*")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId);
    if (error) throw new Error(`Projection list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
